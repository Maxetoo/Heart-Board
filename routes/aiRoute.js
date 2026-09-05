const express = require('express');
const { rateLimit } = require('express-rate-limit');
const AiRoute = express.Router();

const { moderate, refine, transcribe } = require('../controllers/aiController');
const { authentication } = require('../middlewares/authMiddleware');

// These calls cost money per request, so they get a tighter budget than the
// global limiter in app.js.
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  message: { message: 'Too many AI requests. Please slow down and try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

AiRoute.use(authentication, aiLimiter);

AiRoute.post('/moderate', moderate);
AiRoute.post('/refine', refine);
AiRoute.post('/transcribe', transcribe);

module.exports = AiRoute;
