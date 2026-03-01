const Subscription = require('../models/subscription');
const User = require('../models/userModel');
const {stripe, STRIPE_PRICE_IDS} = require('../configs/stripeConfig')
const CustomError = require('../error');
const {StatusCodes} = require('http-status-codes');



// get my subs 
const getMySubscription = async (req, res) => {
  const userId = req.user.userId;
  const subscription = await Subscription.findOne({ user: userId });

  if (!subscription) {
    throw new CustomError.NotFoundError('Subscription not found.');
  }

  res.status(StatusCodes.OK).json({ subscription, limits: subscription.getLimits() });
};

// create checkout session for upgrading subscription
const createCheckoutSession = async (req, res) => {
  const { plan } = req.body;
  const userId = req.user.userId;

  if (!['pro', 'enterprise'].includes(plan)) {
    throw new CustomError.BadRequestError('Invalid plan. Choose pro or enterprise.');
  }

  const subscription = await Subscription.findOne({ user: userId});
  if (subscription.plan === plan) {
    throw new CustomError.BadRequestError(`You are already on the ${plan} plan.`);
  }

  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    throw new CustomError.BadRequestError('Plan price not configured.');
  }
 
  const user = await User.findById(userId);

  // Reuse existing Stripe customer or create a new one
  let customerId = subscription.externalCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user._id.toString() },
    });
    customerId = customer.id;
    subscription.externalCustomerId = customerId;
    await subscription.save();
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId: user._id.toString(), plan },
    success_url: `${process.env.ALLOWED_ORIGIN}/settings/subscription?success=true`,
    cancel_url:  `${process.env.ALLOWED_ORIGIN}/settings/subscription?cancelled=true`,
  });

  res.status(StatusCodes.OK).json({ url: session.url });
};


// cancel subscription 
const cancelSubscription = async (req, res) => {
  const userId = req.user.userId;
  const subscription = await Subscription.findOne({ user: userId });

  if (subscription.plan === 'free') {
    throw new CustomError.BadRequestError('You are on the free plan — nothing to cancel.');
  }

  if (!subscription.externalSubscriptionId) {
    throw new CustomError.BadRequestError('No active subscription found to cancel.');
  }

  // Cancel at period end so user isn't cut off immediately
  await stripe.subscriptions.update(subscription.externalSubscriptionId, {
    cancel_at_period_end: true,
  });

  subscription.status = 'cancelled';
  await subscription.save();

  res.status(StatusCodes.OK).json({
    message: 'Subscription will cancel at the end of the current billing period.',
    currentPeriodEnd: subscription.currentPeriodEnd,
  });
};


// stripe webhook 
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new CustomError.BadRequestError(`Webhook signature error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { userId, plan } = session.metadata;

      const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

      await Subscription.findOneAndUpdate(
        { user: userId },
        {
          plan,
          status: 'active',
          externalSubscriptionId: session.subscription,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        }
      );

      // Sync accountType on user for enterprise plan
      if (plan === 'enterprise') {
        await User.findByIdAndUpdate(userId, { accountType: 'enterprise' });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      await Subscription.findOneAndUpdate(
        { externalSubscriptionId: invoice.subscription },
        { status: 'expired' }
      );
      break;
    }

    case 'customer.subscription.deleted': {
      const stripeSubscription = event.data.object;
      await Subscription.findOneAndUpdate(
        { externalSubscriptionId: stripeSubscription.id },
        { plan: 'free', status: 'active', externalSubscriptionId: null, currentPeriodEnd: null }
      );
      break;
    }

    default:
      // Unhandled event type — safe to ignore
      break;
  }

  res.status(StatusCodes.OK).json({ received: true });
};

// admin: list all subscriptions 
const listSubscriptions = async (req, res) => {
  const filter = {};
  if (req.query.plan) filter.plan = req.query.plan;
  if (req.query.status) filter.status = req.query.status;

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

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
  createCheckoutSession,
  cancelSubscription,
  stripeWebhook,
  listSubscriptions,
};