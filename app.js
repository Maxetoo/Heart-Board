require('express-async-errors');
require('dotenv').config();

const express = require('express'); 
const http = require('http');
const path = require('path');
const fileUploader = require('express-fileupload');
const {rateLimit} = require('express-rate-limit');
const mongoose = require('mongoose');
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cookieParser = require('cookie-parser');
const morgan = require('morgan'); 
const helmet = require('helmet'); 
const compression = require('compression');
const cors = require('cors');
const cron = require('node-cron');  
const axios = require('axios');
const passport = require('./configs/passport')
const session = require('express-session');


const origin = process.env.ALLOWED_ORIGIN

// Express app and server initialization
const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1); 

// Rate limit setup.
// The SPA is chattier than the old frontend (feed + profile + reactions +
// message loads on a single screen), so a 100/15min budget was exhausting a
// normal session. Reads get a generous budget here; auth and AI routes carry
// their own tighter limiters.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Never rate-limit the SPA's own static assets.
  skip: (req) => !req.path.startsWith('/api/'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter
app.use(limiter);

app.use(helmet({
  contentSecurityPolicy: false,
}));

// In production the SPA is served by this same Express app, so CORS is mostly
// moot. In development the Vite dev server runs on :3000 and proxies /api here,
// but the localhost origins are allowed too as a fallback for direct calls.
const allowedOrigins = [
  origin,
  'https://res.cloudinary.com',
  ...(process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:3000', 'http://127.0.0.1:3000']),
].filter(Boolean);

app.use(cors({
  origin:      allowedOrigins,
  credentials: true,
}));

// Additional middlewares
app.use(fileUploader({ useTempFiles: true, tempFileDir: '/tmp/' }));
app.use(compression());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: false, limit: '15mb' }));
app.use(cookieParser(process.env.COOKIE));
app.use(morgan('tiny'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve Vite frontend static files
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Importing and using routers
const AuthRouter        = require('./routes/authRoute');
const UserRouter        = require('./routes/userRoute'); 
const BoardRouter       = require('./routes/boardRoute');
const MessageRouter     = require('./routes/messageRoute');
const SubscriptionRouter   = require('./routes/subscriptionRoute');
const BoardPaymentRouter   = require('./routes/boardPaymentRoute');
const UploadRouter      = require('./routes/uploadRoute');
const SearchRouter      = require('./routes/searchRoute');
const AiRouter          = require('./routes/aiRoute');

// API routes
app.use('/api/v1/auth', authLimiter, AuthRouter);
app.use('/api/v1/user', UserRouter);
app.use('/api/v1/board', BoardRouter);
app.use('/api/v1/message', MessageRouter);
app.use('/api/v1/subscription', SubscriptionRouter);
app.use('/api/v1/board/payments', BoardPaymentRouter);
app.use('/api/v1/upload', UploadRouter);
app.use('/api/v1/search', SearchRouter);
app.use('/api/v1/ai', AiRouter);
app.get('/api/v1/stats', SearchRouter.globalStats);

// Error handling middlewares
const ErrorMiddleware    = require('./middlewares/errorMiddleware');
const NotFoundMiddleware = require('./middlewares/notFoundRoute');

// Serve frontend for all non-API routes — must be BEFORE NotFoundMiddleware
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.use(NotFoundMiddleware);
app.use(ErrorMiddleware);

// MongoDB connection using MongoClient
const client = new MongoClient(process.env.MONGO_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// MongoDB connection using Mongoose
mongoose.connect(process.env.MONGO_URL, {
  connectTimeoutMS: 10000,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error.message);
});

// Start the app
const port = process.env.PORT || 8080;

const startApp = async () => {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    server.listen(port, () => {
      console.log(`App is listening on port ${port}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB via MongoClient:', error);
  }
};

// Ping self every 5 minutes to prevent idling
cron.schedule('*/5 * * * *', async () => {
  try {
    await axios.get(`${origin}`);
    console.log('Self-pinged to prevent sleep');
  } catch (err) {
    console.error('Self-ping failed:', err.message);
  }
}); 

startApp().catch(console.dir);

require('./workers/uploadAndPostWorker')
require('./workers/emailSendingWorker')