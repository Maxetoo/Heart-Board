const Subscription = require('../models/subscription');
const User         = require('../models/userModel');
const CustomError  = require('../error');
const { StatusCodes } = require('http-status-codes');
const {
  getSubscriberInfo,
  getActiveEntitlements,
  verifyWebhookSecret,
  RC_ENTITLEMENTS,
} = require('../configs/revenueCatConfig');
const { invalidate, keys } = require('../middlewares/cacheMiddleware');


const getMySubscription = async (req, res) => {
  const userId = req.user.userId;
  const subscription = await Subscription.findOne({ user: userId });
  if (!subscription) throw new CustomError.NotFoundError('Subscription not found.');
  res.status(StatusCodes.OK).json({ subscription, limits: subscription.getLimits() });
};


const verifyPurchase = async (req, res) => {
  const { appUserId, plan } = req.body;
  const userId = req.user.userId;

  if (!appUserId) throw new CustomError.BadRequestError('appUserId is required.');
  if (!['pro', 'enterprise'].includes(plan)) {
    throw new CustomError.BadRequestError('Invalid plan. Choose pro or enterprise.');
  }

  // Fetch entitlements directly from RevenueCat REST API
  let subscriber;
  try {
    subscriber = await getSubscriberInfo(appUserId);
  } catch (err) {
    throw new CustomError.BadRequestError('Could not verify purchase with RevenueCat.');
  }

  const entitlements = subscriber.entitlements ?? {};
  const planEntitlement = RC_ENTITLEMENTS.PRO;
  const isActive = entitlements[planEntitlement]
    && (
      entitlements[planEntitlement].expires_date === null ||
      new Date(entitlements[planEntitlement].expires_date) > new Date()
    );

  if (!isActive) {
    throw new CustomError.BadRequestError('No active entitlement found for this plan. Please complete the purchase first.');
  }

  // Find the active subscription product to get period end
  const subscriptions = subscriber.subscriptions ?? {};
  let currentPeriodEnd = null;
  let productId = null;

  for (const [prodId, sub] of Object.entries(subscriptions)) {
    if (sub.expires_date && new Date(sub.expires_date) > new Date()) {
      currentPeriodEnd = new Date(sub.expires_date);
      productId = prodId;
      break;
    }
  }

  const subscription = await Subscription.findOneAndUpdate(
    { user: userId },
    {
      plan,
      status:                'active',
      currentPeriodEnd,
      revenueCatUserId:      appUserId,
      revenueCatProductId:   productId,
      revenueCatEntitlement: planEntitlement,
    },
    { new: true }
  );

  if (plan === 'enterprise') {
    await User.findByIdAndUpdate(userId, { accountType: 'enterprise' });
  }

  // Bust profile cache so new limits are reflected immediately
  await invalidate(keys.profile(userId));

  res.status(StatusCodes.OK).json({
    message: `Successfully activated ${plan} plan.`,
    subscription,
    limits: subscription.getLimits(),
  });
};


const cancelSubscription = async (req, res) => {
  const userId = req.user.userId;
  const subscription = await Subscription.findOne({ user: userId });

  if (subscription.plan === 'free') {
    throw new CustomError.BadRequestError('You are on the free plan — nothing to cancel.');
  }

  subscription.status = 'cancelled';
  await subscription.save();

  await invalidate(keys.profile(userId));

  res.status(StatusCodes.OK).json({
    message: 'Subscription marked as cancelled. Access continues until the current period ends.',
    currentPeriodEnd: subscription.currentPeriodEnd,
  });
};


const revenueCatWebhook = async (req, res) => {
  const authHeader = req.headers['authorization'] ?? '';

  if (!verifyWebhookSecret(authHeader)) {
    throw new CustomError.UnauthorizedError('Invalid webhook secret.');
  }

  const event = req.body.event;
  if (!event) {
    return res.status(StatusCodes.OK).json({ received: true });
  }

  const {
    type,
    app_user_id: appUserId,
    product_id:  productId,
    expiration_at_ms: expirationAtMs,
    entitlement_ids:  entitlementIds,
  } = event;

  const subscription = await Subscription.findOne({ revenueCatUserId: appUserId });

  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE': {
      if (!subscription) break;

      const isPro = entitlementIds?.includes(RC_ENTITLEMENTS.PRO);
      const plan  = isPro ? 'pro' : 'free';

      await Subscription.findOneAndUpdate(
        { revenueCatUserId: appUserId },
        {
          plan,
          status:              'active',
          revenueCatProductId: productId,
          currentPeriodEnd:    expirationAtMs ? new Date(expirationAtMs) : null,
        }
      );

      await invalidate(keys.profile(subscription.user.toString()));
      break;
    }

    case 'CANCELLATION': {
      if (!subscription) break;
      await Subscription.findOneAndUpdate(
        { revenueCatUserId: appUserId },
        { status: 'cancelled' }
      );
      await invalidate(keys.profile(subscription.user.toString()));
      break;
    }

    case 'EXPIRATION': {
      if (!subscription) break;
      await Subscription.findOneAndUpdate(
        { revenueCatUserId: appUserId },
        {
          plan:                'free',
          status:              'active',
          currentPeriodEnd:    null,
          revenueCatProductId: null,
          revenueCatEntitlement: null,
        }
      );

      // Revert enterprise account type
      await User.findByIdAndUpdate(subscription.user, { accountType: 'personal' });
      await invalidate(keys.profile(subscription.user.toString()));
      break;
    }

    default:
      break;
  }

  res.status(StatusCodes.OK).json({ received: true });
};


const listSubscriptions = async (req, res) => {
  const filter = {};
  if (req.query.plan)   filter.plan   = req.query.plan;
  if (req.query.status) filter.status = req.query.status;

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const [subscriptions, total] = await Promise.all([
    Subscription.find(filter)
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Subscription.countDocuments(filter),
  ]);

  res.status(StatusCodes.OK).json({
    subscriptions,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};


module.exports = {
  getMySubscription,
  verifyPurchase,
  cancelSubscription,
  revenueCatWebhook,
  listSubscriptions,
};