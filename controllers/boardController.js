const User = require('../models/userModel');
const Board = require('../models/boardModel');
const Subscription = require('../models/subscription');
const Sponsorship = require('../models/sponsporship');
const Like = require('../models/boardLikeModel');
const CustomError = require('../error');
const {StatusCodes} = require('http-status-codes');


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
  const { title, description, visibility, receipent} = req.body;

  const subscription = await Subscription.findOne({ user: req.user.userId });
  const limits = subscription.getLimits();

  // enforce board limit for non-unlimited plans
  if (limits.boardLimit !== -1) {
    const boardCount = await Board.countDocuments({
      owner: userId,
      isActive: true,
    });

    if (boardCount >= limits.boardLimit) {
      throw new CustomError.BadRequestError(`Your ${subscription.plan} plan allows a maximum of ${limits.boardLimit} boards. Upgrade to create more.`)
    }
  }

  const user = await User.findOne({username: receipent, isActive: true});

  if (receipent && !user) {
    throw new CustomError.BadRequestError('Receipent user not found.');
  }

  const board = await Board.create({
    owner: userId,
    title,
    description,
    visibility: visibility || 'private',
    receipent
  });

  res.status(StatusCodes.CREATED).json({ message: 'Board created.', board });
};


// get all boards for the authenticated user (with pagination)
const getMyBoards = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip = (page - 1) * limit;

  const [boards, total] = await Promise.all([
    Board.find({ owner: req.user.userId, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Board.countDocuments({ owner: req.user.userId, isActive: true }),
  ]);

  res.status(StatusCodes.OK).json({
    boards,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};


// get single board by slug (with visibility check)
const getBoardBySlug = async (req, res) => {
  const {slug} = req.params;
  const board = await Board.findOne({ slug, isActive: true }).populate(
    'owner',
    'username profileImage'
  );

  if (!board) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Board not found.' });
  }

  const isOwner = req.user && board.owner._id.toString() === req.user.userId.toString();

  // visibility gate
  if (board.visibility === 'private' && !isOwner) {
    return res.status(StatusCodes.FORBIDDEN).json({ message: 'This board is private.' });
  }

  // increment visits (non-blocking)
  Board.findByIdAndUpdate(board._id, { $inc: { 'stats.visits': 1 } }).exec();

  // load active sponsorships for display
  const sponsors = await Sponsorship.find({ board: board._id, status: 'active' })
    .populate('sponsor', 'username profileImage')
    .select('sponsor amount message isAnonymous createdAt');

  res.status(StatusCodes.OK).json({ board, sponsors });
};


// update board (only owner)
const updateBoard = async (req, res) => {
  const {id} = req.params;
  const board = await requireBoardOwner(res, id, req.user.userId);
  if (!board) return;

  const { title, description, visibility } = req.body;
  if (title !== undefined) board.title = title;
  if (description !== undefined) board.description = description;
  if (visibility !== undefined) board.visibility = visibility;

  await board.save();
  res.status(StatusCodes.OK).json({ message: 'Board updated.', board });
};


// delete board
const deleteBoard = async (req, res) => {
  const {id} = req.params;
  const board = await requireBoardOwner(res, id, req.user.userId);
  if (!board) return;

  board.isActive = false;
  await board.save();

  res.status(StatusCodes.OK).json({ message: 'Board deleted.' });
};

// like and unlike a board 
const likeBoard = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!id) {
    throw new CustomError.BadRequestError('Board id is required');
  }

  if (!userId) {
    throw new CustomError.BadRequestError('Please sign in');
  }

  const board = await Board.findById(id);
  if (!board) {
    throw new CustomError.NotFoundError('Board not found');
  }

  const existingLike = await Like.findOne({ board: id, user: userId });

  if (existingLike) {
    await existingLike.deleteOne();
    board.stats.likes -= 1;
    await board.save();

    return res.status(StatusCodes.OK).json({
      liked: false,
      likeCount: board.stats.likes
    });
  }

  await Like.create({ board: id, user: userId });
  board.stats.likes += 1;
  await board.save();

  res.status(StatusCodes.OK).json({
    liked: true,
    likeCount: board.stats.likes
  });
};





// share a board (returns shareable URL and increments share count)
const shareBoard = async (req, res) => {
  const {id} = req.params;
  const board = await Board.findOneAndUpdate(
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


// disocver public boards with pagination and sorting
const discoverBoards = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 12);
  const skip = (page - 1) * limit;
  const sort = req.query.sort === 'popular' ? { 'stats.visits': -1 } : { createdAt: -1 };

  const [boards, total] = await Promise.all([
    Board.find({ visibility: 'public', isActive: true })
      .populate('owner', 'username profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('title description slug stats tier owner createdAt'),
    Board.countDocuments({ visibility: 'public', isActive: true }),
  ]);

  res.status(StatusCodes.OK).json({
    boards,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
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
};