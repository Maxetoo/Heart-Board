const BoardPayment = require('../models/boardPaymentModel');
const Board = require('../models/boardModel');
const { stripe, TIER_ORDER, TIER_UPGRADE_PRICES} = require('../configs/stripeConfig');
const CustomError = require('../error');
const {StatusCodes} = require('http-status-codes');



// upgrade board 
const createBoardUpgrade = async (req, res) => {
  const userId = req.user.userId;
  const { toTier } = req.body;

  if (!['standard', 'premium'].includes(toTier)) {
    throw new CustomError.BadRequestError('toTier must be either standard or premium.');
  }

  const board = await Board.findOne({ _id: req.params.id, owner: userId, isActive: true });

  if (!board) {
    throw new CustomError.NotFoundError('Board not found or you do not own it.');
  }

  if (TIER_ORDER[toTier] <= TIER_ORDER[board.tier]) {
    throw new CustomError.BadRequestError(`Board is already on ${board.tier} tier. Choose a higher tier.`);
  }

  const priceKey = `${board.tier}→${toTier}`;
  const amount = TIER_UPGRADE_PRICES[priceKey];
  if (!amount) {
    throw new CustomError.BadRequestError('Unsupported tier upgrade path.');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Board Upgrade: ${board.tier} → ${toTier}`,
          },
          unit_amount: amount, 
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/upgrade/cancel`,
    metadata: {
      boardId: board._id.toString(),
      userId: userId.toString(),
      fromTier: board.tier,
      toTier,
    },
  });

  // Record payment in DB with pending status
  const payment = await BoardPayment.create({
    board: board._id,
    paidBy: userId,
    fromTier: board.tier,
    toTier,
    amount,
    currency: 'usd',
    status: 'pending',
    externalPaymentId: session.id, 
  });

  res.status(StatusCodes.CREATED).json({
    paymentUrl: session.url,
    payment: { id: payment._id, fromTier: payment.fromTier, toTier: payment.toTier, amount },
  });
};

// stripe webhook for board payment
const boardPaymentWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_BOARD_WEBHOOK_SECRET);
  } catch (err) {
    throw new CustomError.BadRequestError(`Webhook error: ${err.message}`);
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

  res.status(StatusCodes.OK).json({ received: true });
};

// get all payments for a board
const getBoardPayments = async (req, res) => {
  const userId = req.user.userId;
  const board = await Board.findOne({ _id: req.params.id, owner: userId, isActive: true });
  if (!board) {
    throw new CustomError.NotFoundError('Board not found or you do not own it.');
  }

  const payments = await BoardPayment.find({ board: board._id })
    .sort({ createdAt: -1 })
    .select('-externalPaymentId');

  res.status(StatusCodes.OK).json({ payments, currentTier: board.tier });
};

// all board payments (admin only)
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

  res.status(StatusCodes.OK).json({
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