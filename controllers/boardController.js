const User = require('../models/userModel');
const Board = require('../models/boardModel');
const Subscription = require('../models/subscription');
const Sponsorship = require('../models/sponsporship');
const Like = require('../models/boardLikeModel');
const CustomError = require('../error');
const { StatusCodes } = require('http-status-codes');

// helper to check board ownership and existence
const requireBoardOwner = async (res, boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board || !board.isActive) {
    throw new CustomError.NotFoundError('Board not found.');
  }
  if (board.owner.toString() !== userId.toString()) {
    throw new CustomError.UnauthorizedError('You do not own this board.');
  }
  return board;
};



const createBoard = async (req, res) => {
  const userId = req.user.userId;
  const { title, description, visibility, receipent, event, coverImage, tags, coverImagePublicId } = req.body;

  let createdBoard = null;  

  try {
    const subscription = await Subscription.findOne({ user: req.user.userId });
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
      const receipentUser = await User.findOne({
        username: receipent.trim().toLowerCase(),
        isActive: true,
      });
      if (!receipentUser) {
        throw new CustomError.BadRequestError('Receipent user not found.');
      }
      receipentId = receipentUser._id;
    }

    const board = await Board.create({
      owner: userId,
      title,
      description,
      event,
      visibility: visibility || 'public',
      receipent,
      coverImage: coverImage || null,
      tags:       Array.isArray(tags) ? tags : [],
    });
    createdBoard = board;

    if (coverImagePublicId) {
      try {
        await uploadSendingQueue.add(
          'verify-and-guard',
          {
            boardId:            board._id,
            cloudinaryPublicId: coverImagePublicId,
            fileType:           'image',
          },
          {
            delay:            3000,
            attempts:         3,
            backoff:          { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail:     { age: 86400 },
          }
        );
      } catch (queueErr) {
        console.error('[createBoard] Failed to enqueue cleanup guard:', queueErr.message);
      }
    }

    res.status(StatusCodes.CREATED).json({ message: 'Board created.', board });

  } catch (err) {
    if (coverImagePublicId) {
      try {
        await deleteFromCloudinary(coverImagePublicId, 'image');
      } catch (cleanupErr) {
        console.error('[createBoard] Cloudinary rollback failed:', cleanupErr.message);
      }
    }

    if (createdBoard?._id) {
      try {
        await Board.findByIdAndDelete(createdBoard._id);
      } catch (rollbackErr) {
        console.error('[createBoard] Board rollback failed:', rollbackErr.message);
      }
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

  if (!['owned', 'tagged'].includes(view)) {
    throw new CustomError.BadRequestError('view must be owned or tagged.');
  }

  const filter = view === 'tagged' ? { receipent: userId } : { owner: userId };

  if (tier)       filter.tier       = tier;
  if (visibility) filter.visibility = visibility;
  if (event)      filter.event      = event;

  if (status === 'inactive')    filter.isActive = false;
  else if (status !== 'all')    filter.isActive = true;

  if (view === 'tagged' && req.query.flagged !== undefined) {
    filter.receipentFlagged = req.query.flagged === 'true';
  }

  const query = Board.find(filter);
  if (view === 'tagged') query.populate('owner', 'username profileImage');

  const [boards, total] = await Promise.all([
    query
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title description slug stats tier tags visibility isActive receipentFlagged receiprentFlagReason owner coverImage createdAt'),
    Board.countDocuments(filter),
  ]);

  let taggedSummary = null;
  if (view === 'tagged') {
    const [unflagged, flagged] = await Promise.all([
      Board.countDocuments({ receipent: userId, isActive: true, receipentFlagged: false }),
      Board.countDocuments({ receipent: userId, isActive: true, receipentFlagged: true }),
    ]);
    taggedSummary = { unflagged, flagged, total: unflagged + flagged };
  }

  res.status(StatusCodes.OK).json({
    view,
    boards,
    ...(taggedSummary && { taggedSummary }),
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};


const getBoardBySlug = async (req, res) => {
  const { slug } = req.params;
  const board = await Board.findOne({ slug, isActive: true }).populate(
    'owner',
    'username profileImage'
  );

  if (!board) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Board not found.' });
  }

  const isOwner = req.user && board.owner._id.toString() === req.user.userId.toString();

  if (board.visibility === 'private' && !isOwner) {
    return res.status(StatusCodes.FORBIDDEN).json({ message: 'This board is private.' });
  }

  Board.findByIdAndUpdate(board._id, { $inc: { 'stats.visits': 1 } }).exec();

  const sponsors = await Sponsorship.find({ board: board._id, status: 'active' })
    .populate('sponsor', 'username profileImage')
    .select('sponsor amount message isAnonymous createdAt');

  res.status(StatusCodes.OK).json({ board, sponsors });
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
  res.status(StatusCodes.OK).json({ message: 'Board updated.', board });
};


const deleteBoard = async (req, res) => {
  const { id } = req.params;
  const board  = await requireBoardOwner(res, id, req.user.userId);
  if (!board) return;

  board.isActive = false;
  await board.save();
  res.status(StatusCodes.OK).json({ message: 'Board deleted.' });
};


const likeBoard = async (req, res) => {
  const { id }   = req.params;
  const userId   = req.user?.userId;

  if (!id)     throw new CustomError.BadRequestError('Board id is required');
  if (!userId) throw new CustomError.BadRequestError('Please sign in');

  const board = await Board.findById(id);
  if (!board) throw new CustomError.NotFoundError('Board not found');

  const existingLike = await Like.findOne({ board: id, user: userId });

  if (existingLike) {
    await existingLike.deleteOne();
    board.stats.likes -= 1;
    await board.save();
    return res.status(StatusCodes.OK).json({ liked: false, likeCount: board.stats.likes });
  }

  await Like.create({ board: id, user: userId });
  board.stats.likes += 1;
  await board.save();
  res.status(StatusCodes.OK).json({ liked: true, likeCount: board.stats.likes });
};


const shareBoard = async (req, res) => {
  const { id } = req.params;
  const board  = await Board.findOneAndUpdate(
    { _id: id, isActive: true, visibility: { $ne: 'private' } },
    { $inc: { 'stats.shares': 1 } },
    { new: true }
  );

  if (!board) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Board not found or is private.' });
  }

  const shareUrl = `${process.env.ALLOWED_ORIGIN}/board/${board.slug}`;
  res.status(StatusCodes.OK).json({ shareUrl, shares: board.stats.shares });
};


const discoverBoards = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip  = (page - 1) * limit;
  const sort  = req.query.sort === 'popular' ? { 'stats.visits': -1 } : { createdAt: -1 };

  const [boards, total] = await Promise.all([
    Board.find({ visibility: 'public', isActive: true })
      .populate('owner', 'username profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      // coverImage included so discover grid can render thumbnails
      .select('title description slug stats tier owner coverImage createdAt'),
    Board.countDocuments({ visibility: 'public', isActive: true }),
  ]);

  res.status(StatusCodes.OK).json({
    boards,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};


const flagBoard = async (req, res) => {
  const { reason } = req.body;
  const userId     = req.user.userId;

  if (!reason || !reason.trim()) {
    throw new CustomError.BadRequestError('A reason is required to flag a board.');
  }

  const board = await Board.findOne({ slug: req.params.slug, isActive: true });
  if (!board) throw new CustomError.NotFoundError('Board not found.');

  if (!board.receipent || board.receipent.toString() !== userId.toString()) {
    throw new CustomError.ForbiddenError('Only the designated recipient can flag this board.');
  }

  if (board.receipentFlagged) {
    throw new CustomError.BadRequestError('This board has already been flagged.');
  }

  board.receipentFlagged      = true;
  board.receiprentFlagReason  = reason.trim();
  await board.save();

  res.status(StatusCodes.OK).json({ message: 'Board flagged successfully.' });
};


const unflagBoard = async (req, res) => {
  const userId = req.user.userId;
  const board  = await Board.findOne({ slug: req.params.slug, isActive: true });

  if (!board) throw new CustomError.NotFoundError('Board not found.');

  if (!board.receipent || board.receipent.toString() !== userId.toString()) {
    throw new CustomError.ForbiddenError('Only the designated recipient can unflag this board.');
  }

  if (!board.receipentFlagged) {
    throw new CustomError.BadRequestError('This board is not flagged.');
  }

  board.receipentFlagged     = false;
  board.receiprentFlagReason = null;
  await board.save();

  res.status(StatusCodes.OK).json({ message: 'Flag removed.' });
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
};