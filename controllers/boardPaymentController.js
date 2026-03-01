const BoardPayment = require('../models/BoardPayment');
const Board = require('../models/Board');
const { stripe } = require('../configs/stripeConfig');
// Price per tier upgrade in cents (USD) — move to config/env


// ─── Create Board Tier Upgrade Payment ───────────────────────────────────────

/**
 * POST /api/boards/:id/upgrade
 * Requires auth + board ownership
 * Body: { toTier: 'standard' | 'premium' }
 *
 * Creates a Stripe PaymentIntent for a one-time board upgrade.
 * The client confirms the payment using the returned clientSecret.
 * On success, webhook finalises the tier change.
 */
const createBoardUpgrade = async (req, res) => {
  const { toTier } = req.body;

  if (!['standard', 'premium'].includes(toTier)) {
    return res.status(400).json({ message: 'toTier must be standard or premium.' });
  }

  const board = await Board.findOne({ _id: req.params.id, owner: req.user.id, isActive: true });
  if (!board) {
    return res.status(404).json({ message: 'Board not found or you do not own it.' });
  }

  if (TIER_ORDER[toTier] <= TIER_ORDER[board.tier]) {
    return res.status(400).json({
      message: `Board is already on ${board.tier} tier. Choose a higher tier.`,
    });
  }

  const priceKey = `${board.tier}→${toTier}`;
  const amount = TIER_UPGRADE_PRICES[priceKey];
  if (!amount) {
    return res.status(400).json({ message: 'Unsupported tier upgrade path.' });
  }

  // Create Stripe PaymentIntent (one-time charge)
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata: {
      boardId: board._id.toString(),
      userId: req.user.id.toString(),
      fromTier: board.tier,
      toTier,
    },
  });

  // Record the payment as pending
  const payment = await BoardPayment.create({
    board: board._id,
    paidBy: req.user.id,
    fromTier: board.tier,
    toTier,
    amount,
    currency: 'usd',
    status: 'pending',
    externalPaymentId: paymentIntent.id,
  });

  res.status(200).json({
    clientSecret: paymentIntent.client_secret,
    payment: { id: payment._id, fromTier: payment.fromTier, toTier: payment.toTier, amount },
  });
};

// ─── Stripe Webhook for Board Payments ───────────────────────────────────────

/**
 * POST /api/boards/payment/webhook
 * Raw body required.
 *
 * Handles:
 *   - payment_intent.succeeded  → upgrade board tier
 *   - payment_intent.payment_failed → mark as failed
 */
const boardPaymentWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_BOARD_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      const { boardId, fromTier, toTier } = pi.metadata;

      // Mark payment succeeded
      await BoardPayment.findOneAndUpdate(
        { externalPaymentId: pi.id },
        { status: 'succeeded' }
      );

      // Upgrade board tier
      await Board.findByIdAndUpdate(boardId, { tier: toTier });
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      await BoardPayment.findOneAndUpdate(
        { externalPaymentId: pi.id },
        { status: 'failed' }
      );
      break;
    }

    default:
      break;
  }

  res.status(200).json({ received: true });
};

// ─── Get Upgrade History for a Board ─────────────────────────────────────────

/**
 * GET /api/boards/:id/upgrades
 * Requires auth + board ownership
 */
const getBoardPayments = async (req, res) => {
  const board = await Board.findOne({ _id: req.params.id, owner: req.user.id, isActive: true });
  if (!board) {
    return res.status(404).json({ message: 'Board not found or you do not own it.' });
  }

  const payments = await BoardPayment.find({ board: board._id })
    .sort({ createdAt: -1 })
    .select('-externalPaymentId');

  res.status(200).json({ payments, currentTier: board.tier });
};

// ─── Admin: All Board Payments ────────────────────────────────────────────────

/**
 * GET /api/boards/payments/all
 * Requires admin role
 */
const listAllBoardPayments = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [payments, total] = await Promise.all([
    BoardPayment.find(filter)
      .populate('board', 'title slug')
      .populate('paidBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    BoardPayment.countDocuments(filter),
  ]);

  res.status(200).json({
    payments,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};

module.exports = {
  createBoardUpgrade,
  boardPaymentWebhook,
  getBoardPayments,
  listAllBoardPayments,
};