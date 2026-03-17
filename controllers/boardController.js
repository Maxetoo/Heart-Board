const User = require('../models/userModel');
const Board = require('../models/boardModel');
const Subscription = require('../models/subscription');
const Sponsorship = require('../models/sponsporship');
const Like = require('../models/boardLikeModel');
const CustomError = require('../error');
const { StatusCodes } = require('http-status-codes');
const { invalidate, invalidatePattern, keys } = require('../middlewares/cacheMiddleware');

const requireBoardOwner = async (res, boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board || !board.isActive) throw new CustomError.NotFoundError('Board not found.');
  if (board.owner.toString() !== userId.toString()) throw new CustomError.UnauthorizedError('You do not own this board.');
  return board;
};


const createBoard = async (req, res) => {
  const userId = req.user.userId;
  const { title, description, visibility, receipent, event, coverImage, tags, coverImagePublicId } = req.body;
  let createdBoard = null;

  try {
    const subscription = await Subscription.findOne({ user: userId });
    const limits = subscription.getLimits();

    if (limits.boardLimit !== -1) {
      const boardCount = await Board.countDocuments({ owner: userId, isActive: true });
      if (boardCount >= limits.boardLimit) {
        throw new CustomError.BadRequestError(
          `Your ${subscription.plan} plan allows a maximum of ${limits.boardLimit} boards. Upgrade to create more.`
        );
      }
    }

    let receipentId = null;
    if (receipent?.length > 0 && receipent.trim()) {
      const receipentUser = await User.findOne({ username: receipent.trim().toLowerCase() });
      if (!receipentUser) throw new CustomError.BadRequestError('Receipent user not found.');
      receipentId = receipentUser._id;
    }

    const board = await Board.create({
      owner:      userId,
      title,
      description,
      event,
      visibility: visibility || 'public',
      receipent:  receipentId,
      coverImage: coverImage || null,
      tags:       Array.isArray(tags) ? tags : [],
    });
    createdBoard = board;

    if (coverImagePublicId) {
      try {
        const uploadSendingQueue = require('../workers/uploadAndPostWorker');
        await uploadSendingQueue.add(
          'verify-and-guard',
          { boardId: board._id, cloudinaryPublicId: coverImagePublicId, fileType: 'image' },
          { delay: 3000, attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true, removeOnFail: { age: 86400 } }
        );
      } catch (queueErr) {
        console.error('[createBoard] Failed to enqueue cleanup guard:', queueErr.message);
      }
    }

    // Bust owner's boards cache + discover + recipient's tagged boards cache
    const invalidations = [
      invalidatePattern(`myBoards:${userId}:*`),
      invalidatePattern('discover:*'),
    ];
    if (receipentId) {
      invalidations.push(invalidatePattern(`myBoards:${receipentId.toString()}:*`));
    }
    await Promise.all(invalidations);

    res.status(StatusCodes.CREATED).json({ message: 'Board created.', board });

  } catch (err) {
    if (coverImagePublicId) {
      try {
        const { deleteFromCloudinary } = require('../services/cloudinaryUpload');
        await deleteFromCloudinary(coverImagePublicId, 'image');
      } catch (e) {}
    }
    if (createdBoard?._id) {
      try { await Board.findByIdAndDelete(createdBoard._id); } catch (e) {}
    }
    throw err;
  }
};


const getMyBoards = async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page)  || 1);
  const limit  = Math.min(50, parseInt(req.query.limit) || 12);
  const skip   = (page - 1) * limit;
  const userId = req.user.userId;
  const { view = 'owned', tier, visibility, status, event } = req.query;

  if (!['owned', 'tagged'].includes(view)) throw new CustomError.BadRequestError('view must be owned or tagged.');

  let filter;
  if (view === 'tagged') {
    filter = {
      receipent:        userId,
      receipentFlagged: false,
      isActive:         true,
    };
  } else {
    filter = { owner: userId };
    if (status === 'inactive') filter.isActive = false;
    else if (status !== 'all') filter.isActive = true;
  }

  if (tier)       filter.tier       = tier;
  if (visibility) filter.visibility = visibility;
  if (event)      filter.event      = event;

  const query = Board.find(filter);
  if (view === 'tagged') query.populate('owner', 'username profileImage');

  const [boards, total] = await Promise.all([
    query
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title description slug stats tier tags visibility event isActive receipentFlagged receiprentFlagReason owner coverImage createdAt'),
    Board.countDocuments(filter),
  ]);

  res.status(StatusCodes.OK).json({
    view,
    boards,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};


const getBoardBySlug = async (req, res) => {
  const { slug } = req.params;
  const board = await Board.findOne({ slug, isActive: true })
    .populate('owner', 'username profileImage')
    .populate('receipent', 'username profileImage');

  if (!board) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Board not found.' });

  const isOwner = req.user && board.owner._id.toString() === req.user.userId.toString();
  if (board.visibility === 'private' && !isOwner) {
    return res.status(StatusCodes.FORBIDDEN).json({ message: 'This board is private.' });
  }

  Board.findByIdAndUpdate(board._id, { $inc: { 'stats.visits': 1 } }).exec();

  const sponsors = await Sponsorship.find({ board: board._id, status: 'active' })
    .populate('sponsor', 'username profileImage')
    .select('sponsor amount message isAnonymous createdAt');

  const boardObj = board.toObject();
  if (board.receipentFlagged) boardObj.receipent = null;

  res.status(StatusCodes.OK).json({ board: boardObj, sponsors });
};


const updateBoard = async (req, res) => {
  const { id } = req.params;
  const board  = await requireBoardOwner(res, id, req.user.userId);
  if (!board) return;

  const { title, description, visibility, coverImage } = req.body;
  if (title       !== undefined) board.title       = title;
  if (description !== undefined) board.description = description;
  if (visibility  !== undefined) board.visibility  = visibility;
  if (coverImage  !== undefined) board.coverImage  = coverImage;

  await board.save();

  await Promise.all([
    invalidate(keys.board(board.slug)),
    invalidatePattern(`myBoards:${req.user.userId}:*`),
    invalidatePattern('discover:*'),
  ]);

  res.status(StatusCodes.OK).json({ message: 'Board updated.', board });
};


const deleteBoard = async (req, res) => {
  const { id }  = req.params;
  const userId  = req.user.userId;
  const board   = await requireBoardOwner(res, id, userId);
  if (!board) return;

  // Capture receipent before deactivating (for cache bust)
  const receipentId = board.receipent?.toString() ?? null;

  board.isActive = false;
  await board.save();

  const owner = await User.findById(userId).select('username').lean();

  const invalidations = [
    invalidate(keys.board(board.slug)),
    invalidatePattern(`myBoards:${userId}:*`),
    invalidatePattern(`boardMsgs:${board.slug}:*`),
    invalidatePattern('discover:*'),
    invalidate(keys.profile(userId)),
    owner?.username ? invalidate(keys.publicProfile(owner.username.toLowerCase())) : Promise.resolve(),
  ];
  if (receipentId) {
    invalidations.push(invalidatePattern(`myBoards:${receipentId}:*`));
  }
  await Promise.all(invalidations);

  res.status(StatusCodes.OK).json({ message: 'Board deleted.' });
};


const likeBoard = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  if (!id)     throw new CustomError.BadRequestError('Board id is required');
  if (!userId) throw new CustomError.BadRequestError('Please sign in');

  const board = await Board.findById(id);
  if (!board) throw new CustomError.NotFoundError('Board not found');

  const existingLike = await Like.findOne({ board: id, user: userId });

  if (existingLike) {
    await existingLike.deleteOne();
    board.stats.likes -= 1;
    await board.save();
    await invalidate(keys.board(board.slug));
    return res.status(StatusCodes.OK).json({ liked: false, likeCount: board.stats.likes });
  }

  await Like.create({ board: id, user: userId });
  board.stats.likes += 1;
  await board.save();
  await invalidate(keys.board(board.slug));

  res.status(StatusCodes.OK).json({ liked: true, likeCount: board.stats.likes });
};


const shareBoard = async (req, res) => {
  const { id } = req.params;
  const board  = await Board.findOneAndUpdate(
    { _id: id, isActive: true, visibility: { $ne: 'private' } },
    { $inc: { 'stats.shares': 1 } },
    { new: true }
  );
  if (!board) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Board not found or is private.' });

  await invalidate(keys.board(board.slug));

  const shareUrl = `${process.env.ALLOWED_ORIGIN}/board/${board.slug}`;
  res.status(StatusCodes.OK).json({ shareUrl, shares: board.stats.shares });
};


const discoverBoards = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip  = (page - 1) * limit;
  const sort  = req.query.sort === 'popular' ? { 'stats.visits': -1 } : { createdAt: -1 };

  const filter = { visibility: 'public', isActive: true, receipentFlagged: false };
  if (req.query.event) filter.event = req.query.event;

  const [boards, total] = await Promise.all([
    Board.find(filter)
      .populate('owner', 'username profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('title description slug stats tier owner coverImage event createdAt'),
    Board.countDocuments(filter),
  ]);

  res.status(StatusCodes.OK).json({
    boards,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};


const flagBoard = async (req, res) => {
  const { reason } = req.body;
  const userId     = req.user.userId;

  if (!reason || !reason.trim()) throw new CustomError.BadRequestError('A reason is required to flag a board.');

  const board = await Board.findOne({ slug: req.params.slug, isActive: true });
  if (!board) throw new CustomError.NotFoundError('Board not found.');

  if (!board.receipent || board.receipent.toString() !== userId.toString())
    throw new CustomError.ForbiddenError('Only the designated recipient can flag this board.');

  if (board.receipentFlagged) throw new CustomError.BadRequestError('This board has already been flagged.');

  board.receipentFlagged    = true;
  board.receiprentFlagReason = reason.trim();
  board.receipent           = null;
  await board.save();

  await Promise.all([
    invalidate(keys.board(board.slug)),
    invalidatePattern(`myBoards:${userId}:*`),
    invalidatePattern('discover:*'),
  ]);

  res.status(StatusCodes.OK).json({ message: 'Board flagged successfully.' });
};


const unflagBoard = async (req, res) => {
  const userId = req.user.userId;
  const board  = await Board.findOne({ slug: req.params.slug, isActive: true });
  if (!board) throw new CustomError.NotFoundError('Board not found.');

  if (!board.receipentFlagged) throw new CustomError.BadRequestError('This board is not flagged.');

  const isOwner = board.owner.toString() === userId.toString();
  if (!isOwner) throw new CustomError.ForbiddenError('Only the board owner can unflag this board.');

  board.receipentFlagged     = false;
  board.receiprentFlagReason = null;
  await board.save();

  await Promise.all([
    invalidate(keys.board(board.slug)),
    invalidatePattern(`myBoards:${userId}:*`),
    invalidatePattern('discover:*'),
  ]);

  res.status(StatusCodes.OK).json({ message: 'Flag removed.' });
};


const getBoardLikes = async (req, res) => {
  const userId = req.user.userId;
  const likes  = await Like.find({ user: userId }).select('board').lean();
  res.status(StatusCodes.OK).json({ likedBoardIds: likes.map(l => l.board.toString()) });
};


module.exports = {
  createBoard,
  getMyBoards,
  getBoardBySlug,
  updateBoard,
  deleteBoard,
  likeBoard,
  shareBoard,
  discoverBoards,
  flagBoard,
  unflagBoard,
  getBoardLikes,
};