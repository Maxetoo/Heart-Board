const express = require('express');
const SubscriptionRoute = express.Router();
const { getMySubscription,
  createCheckoutSession,
  cancelSubscription,
  stripeWebhook,
  listSubscriptions} = require('../controllers/subscriptionController')
const { authentication, superAdminAuthorization} = require('../middlewares/authMiddleware');

// Subscription Routes
SubscriptionRoute.route('/checkout').post(authentication, createCheckoutSession);
SubscriptionRoute.route('/cancel').post(authentication, cancelSubscription);
SubscriptionRoute.route('/webhook').post(stripeWebhook);
SubscriptionRoute.route('/mine').get(authentication, getMySubscription);

// Admin route to list all subscriptions
SubscriptionRoute.route('/').get(authentication, superAdminAuthorization, listSubscriptions);

module.exports = SubscriptionRoute;