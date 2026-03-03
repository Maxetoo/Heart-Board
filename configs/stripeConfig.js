const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

const TIER_UPGRADE_PRICES = {
  'basic→standard': 499,   
  'standard→premium': 999, 
  'basic→premium': 1399,  
};

const TIER_ORDER = { basic: 0, standard: 1, premium: 2 };


module.exports = {
    stripe,
    STRIPE_PRICE_IDS,
    TIER_UPGRADE_PRICES,
    TIER_ORDER,
};