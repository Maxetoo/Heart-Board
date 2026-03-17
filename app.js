require('express-async-errors');
require('dotenv').config();

const express = require('express'); 
const http = require('http');
const path = require('path');
const fileUploader = require('express-fileupload');
const { rateLimit } = require('express-rate-limit');
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
const passport = require('./configs/passport');
const session = require('express-session');

const origin = process.env.ALLOWED_ORIGIN;

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1); 



const generalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              500,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { message: 'Too many requests, please try again in a few minutes.' },
});


const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              20,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { message: 'Too many auth attempts, please try again later.' },
});

// Upload endpoints — generous time window, low count (uploads are expensive)
const uploadLimiter = rateLimit({
  windowMs:         60 * 60 * 1000,  // 1 hour
  max:              60,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { message: 'Upload limit reached, please try again in an hour.' },
});


app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    imgSrc:     ["'self'", "data:", "https://res.cloudinary.com"],
    mediaSrc:   ["'self'", "https://res.cloudinary.com"],  
    connectSrc: ["'self'", "https://api.cloudinary.com"],
  },
}));

app.use(cors({
  origin:      [origin, 'https://res.cloudinary.com'],
  credentials: true,
}));

app.use(fileUploader({ useTempFiles: true }));
app.use(compression());
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: false, limit: '15mb' }));
app.use(cookieParser(process.env.COOKIE));
app.use(morgan('tiny'));
app.use(session({
  secret:            process.env.SESSION_SECRET,
  resave:            false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve vite frontend
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));


const AuthRouter         = require('./routes/authRoute');
const UserRouter         = require('./routes/userRoute'); 
const BoardRouter        = require('./routes/boardRoute');
const MessageRouter      = require('./routes/messageRoute');
const SubscriptionRouter = require('./routes/subscriptionRoute');
const BoardPaymentRouter = require('./routes/boardPaymentRoute');
const UploadRouter       = require('./routes/uploadRoute');

// Apply targeted rate limiters before routes
app.use('/api/v1/auth',   authLimiter);
app.use('/api/v1/upload', uploadLimiter);
app.use('/api/v1',        generalLimiter);  

app.use('/api/v1/auth', AuthRouter);
app.use('/api/v1/user',  UserRouter);
app.use('/api/v1/board',        BoardRouter);
app.use('/api/v1/message',      MessageRouter);
app.use('/api/v1/subscription', SubscriptionRouter);
app.use('/api/v1/board/payments', BoardPaymentRouter);
app.use('/api/v1/upload',       UploadRouter);



const ErrorMiddleware    = require('./middlewares/errorMiddleware');
const NotFoundMiddleware = require('./middlewares/notFoundRoute');

app.use(NotFoundMiddleware);
app.use(ErrorMiddleware);

// Serve the frontend application for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});


const client = new MongoClient(process.env.MONGO_URL, {
  serverApi: {
    version:          ServerApiVersion.v1,
    strict:           true,
    deprecationErrors:true,
  },
});

mongoose.connect(process.env.MONGO_URL, {
  connectTimeoutMS: 10000,
  serverApi: {
    version:          ServerApiVersion.v1,
    strict:           true,
    deprecationErrors:true,
  },
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error.message);
});


const port = process.env.PORT || 8080;

// start server 
const startApp = async () => {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('MongoDB MongoClient connected');
    server.listen(port, () => console.log(`App listening on port ${port}`));
  } catch (error) {
    console.error('Error connecting to MongoDB via MongoClient:', error);
  }
};

// Self-ping every 5 minutes to prevent idling on free-tier hosting
cron.schedule('*/5 * * * *', async () => {
  try {
    await axios.get(`${origin}`);
    console.log('Self-pinged to prevent sleep');
  } catch (err) {
    console.error('Self-ping failed:', err.message);
  }
}); 

startApp().catch(console.dir);

require('./workers/uploadAndPostWorker');
require('./workers/emailSendingWorker')
