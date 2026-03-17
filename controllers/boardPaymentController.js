const BoardPayment = require('../models/boardPaymentModel');
const Board        = require('../models/boardModel');
const CustomError  = require('../error');
const { StatusCodes } = require('http-status-codes');
const {
  getSubscriberInfo,
  verifyWebhookSecret,
  RC_ENTITLEMENTS,
  TIER_UPGRADE_PRICES,
  TIER_ORDER,
} = require('../configs/revenueCatConfig');
const { invalidate, invalidatePattern, keys } = require('../middlewares/cacheMiddleware');


const createBoardUpgrade = async (req, res) => {
  const userId    = req.user.userId;
  const { appUserId, toTier } = req.body;

  if (!appUserId) throw new CustomError.BadRequestError('appUserId is required.');
  if (!['standard', 'premium'].includes(toTier)) {
    throw new CustomError.BadRequestError('toTier must be standard or premium.');
  }

  const board = await Board.findOne({ _id: req.params.id, owner: userId, isActive: true });
  if (!board) throw new CustomError.NotFoundError('Board not found or you do not own it.');

  if (TIER_ORDER[toTier] <= TIER_ORDER[board.tier]) {
    throw new CustomError.BadRequestError(`Board is already on ${board.tier} tier. Choose a higher tier.`);
  }

  // Verify entitlement with RevenueCat
  let subscriber;
  try {
    subscriber = await getSubscriberInfo(appUserId);
  } catch (err) {
    throw new CustomError.BadRequestError('Could not verify purchase with RevenueCat.');
  }

  const entitlementKey = toTier === 'standard'
    ? RC_ENTITLEMENTS.BOARD_STANDARD
    : RC_ENTITLEMENTS.BOARD_PREMIUM;

  const entitlements = subscriber.entitlements ?? {};
  const isActive = entitlements[entitlementKey]
    && (
      entitlements[entitlementKey].expires_date === null ||
      new Date(entitlements[entitlementKey].expires_date) > new Date()
    );

  if (!isActive) {
    throw new CustomError.BadRequestError('No valid entitlement found for this board upgrade. Please complete the purchase first.');
  }

  const priceKey = `${board.tier}→${toTier}`;
  const amount   = TIER_UPGRADE_PRICES[priceKey] ?? 0;

  // Upgrade board
  board.tier = toTier;
  await board.save();

  // Record payment
  const payment = await BoardPayment.create({
    board:             board._id,
    paidBy:            userId,
    fromTier:          board.tier,
    toTier,
    amount,
    currency:          'usd',
    status:            'succeeded',
    externalPaymentId: appUserId,
  });

  // Bust board cache
  await Promise.all([
    invalidate(keys.board(board.slug)),
    invalidatePattern(`myBoards:${userId}:*`),
    invalidate(keys.profile(userId)),
  ]);

  res.status(StatusCodes.CREATED).json({
    message:  `Board upgraded to ${toTier}.`,
    payment:  { id: payment._id, fromTier: payment.fromTier, toTier: payment.toTier, amount },
    board:    { tier: board.tier, slug: board.slug },
  });
};


const boardPaymentWebhook = async (req, res) => {
  const authHeader = req.headers['authorization'] ?? '';

  if (!verifyWebhookSecret(authHeader)) {
    throw new CustomError.UnauthorizedError('Invalid webhook secret.');
  }

  const event = req.body.event;
  if (!event) return res.status(StatusCodes.OK).json({ received: true });

  const { type, product_id: productId, app_user_id: appUserId } = event;

  if (type === 'NON_SUBSCRIPTION_PURCHASE') {
    console.log(`[RC webhook] NON_SUBSCRIPTION_PURCHASE: product=${productId}, user=${appUserId}`);
  }

  res.status(StatusCodes.OK).json({ received: true });
};


const getBoardPayments = async (req, res) => {
  const userId = req.user.userId;
  const board  = await Board.findOne({ _id: req.params.id, owner: userId, isActive: true });
  if (!board) throw new CustomError.NotFoundError('Board not found or you do not own it.');

  const payments = await BoardPayment.find({ board: board._id })
    .sort({ createdAt: -1 })
    .select('-externalPaymentId');

  res.status(StatusCodes.OK).json({ payments, currentTier: board.tier });
};


const listAllBoardPayments = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [payments, total] = await Promise.all([
    BoardPayment.find(filter)
      .populate('board',  'title slug')
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