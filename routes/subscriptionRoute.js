const express = require('express');
const SubscriptionRoute = express.Router();
const {
  getMySubscription,
  verifyPurchase,
  cancelSubscription,
  revenueCatWebhook,
  listSubscriptions,
} = require('../controllers/subscriptionController');
const { authentication, superAdminAuthorization } = require('../middlewares/authMiddleware');

// RevenueCat webhook — no auth, RC sends its own secret in Authorization header
SubscriptionRoute.post('/webhook', revenueCatWebhook);

// User routes
SubscriptionRoute.get( '/mine',   authentication, getMySubscription);
SubscriptionRoute.post('/verify', authentication, verifyPurchase);
SubscriptionRoute.post('/cancel', authentication, cancelSubscription);

// Admin
SubscriptionRoute.get('/', authentication, superAdminAuthorization, listSubscriptions);

module.exports = SubscriptionRoute;