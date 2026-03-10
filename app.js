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

// Rate limit setup 
const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});



// Apply rate limiter
app.use(limiter);

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


// Additional middlewares
app.use(fileUploader({ useTempFiles: true }));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE));
app.use(morgan('tiny'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// serve vite frontend
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Importing and using routers
const AuthRouter = require('./routes/authRoute');
const UserRouter = require('./routes/userRoute'); 
const BoardRouter = require('./routes/boardRoute');
const MessageRouter = require('./routes/messageRoute');
const SubscriptionRouter = require('./routes/subscriptionRoute');
const BoardPaymentRouter = require('./routes/boardPaymentRoute');
const UploadRouter = require('./routes/uploadRoute');



// API routes  
app.use('/api/v1/auth', AuthRouter);
app.use('/api/v1/user', UserRouter);
app.use('/api/v1/board', BoardRouter);
app.use('/api/v1/message', MessageRouter);
app.use('/api/v1/subscription', SubscriptionRouter);
app.use('/api/v1/board/payments', BoardPaymentRouter);
app.use('/api/v1/upload', UploadRouter);



// Error handling middlewares
const ErrorMiddleware = require('./middlewares/errorMiddleware');
const NotFoundMiddleware = require('./middlewares/notFoundRoute');

app.use(NotFoundMiddleware);
app.use(ErrorMiddleware);

// Serve the frontend application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Start the server
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
