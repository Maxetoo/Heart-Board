const express = require('express');
const { rateLimit } = require('express-rate-limit');
const AiRoute = express.Router();

const { moderate, refine, transcribe } = require('../controllers/aiController');
const { authentication } = require('../middlewares/authMiddleware');

// These calls cost money per request: per-person limit, see middlewares/rateLimiter.js.
const { aiLimiter } = require('../middlewares/rateLimiter');

AiRoute.use(authentication, aiLimiter);

AiRoute.post('/moderate', moderate);
AiRoute.post('/refine', refine);
AiRoute.post('/transcribe', transcribe);

module.exports = AiRoute;
