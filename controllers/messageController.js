const Message = require('../models/message');
const Board = require('../models/boardModel');
const Subscription = require('../models/subscription');
const CustomError = require('../error');
const {StatusCodes} = require('http-status-codes');



const resolveBoard = async (res, slug, senderId) => {
  const board = await Board.findOne({ slug, isActive: true });

  if (!board) {
    throw new CustomError.NotFoundError('Board not found.');
  }

  if (board.visibility === 'private') {
    const isOwner = board.owner.toString() === senderId.toString();
    if (!isOwner) {
      throw new CustomError.ForbiddenError('This board is private.');
    }
  }

  // Check the board's own message capacity
  if (!board.canAcceptMessage()) {
    throw new CustomError.BadRequestError(`This board has reached its message limit (${board.getMessageLimit()}). The owner needs to upgrade this board.`);
  }

  return board;
};



const postMessage = async (req, res) => {
  const { type, content } = req.body;
  const {slug} = req.params;
  console.log("Slug: ", slug)
  const userId = req.user.userId;
  if (!['text', 'audio', 'emblem'].includes(type)) {
    throw new CustomError.BadRequestError('Invalid message type. Must be text, audio, or emblem.');
  }

  const board = await resolveBoard(res, slug, userId);
  if (!board) return;

  // validate content shape per type
  if (type === 'text' && !content?.text) {
    throw new CustomError.BadRequestError('Text messages require text content.');
  }
  if (type === 'audio' && !content?.audioUrl) {
    throw new CustomError.BadRequestError('Audio messages require an audioUrl.');
  }
  if (type === 'emblem' && !content?.text && (!content?.imageUrls || !content.imageUrls.length)) {
    throw new CustomError.BadRequestError('Emblem messages require text or at least one imageUrl.');
  }

  const message = await Message.create({
    board: board._id,
    sender: userId,
    type,
    content,
  });

  // Keep board's message counter in sync
  await Board.findByIdAndUpdate(board._id, { $inc: { 'stats.messages': 1 } });

  res.status(StatusCodes.CREATED).json({ message: 'Message posted.', data: message });
};


// get messages for a board 
const getBoardMessages = async (req, res) => {
  const board = await Board.findOne({ slug: req.params.slug, isActive: true });
  const userId = req.user.userId

  if (!board) {
    throw new CustomError.NotFoundError('Board not found.');
  }

  const isOwner = req.user && board.owner.toString() === userId.toString();

  if (board.visibility === 'private' && !isOwner) {
    throw new CustomError.ForbiddenError('This board is private.');
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = { board: board._id };

  // Non-owners only see approved messages
  if (!isOwner) {
    filter.status = 'approved';
  } else if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }

  const [messages, total] = await Promise.all([
    Message.find(filter)
      .populate('sender', 'username profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments(filter),
  ]);

  res.status(StatusCodes.OK).json({
    messages,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};


// get single message 
const getMessage = async (req, res) => {
  const userId = req.user.userId
  const message = await Message.findById(req.params.id)
    .populate('sender', 'username profileImage')
    .populate('board', 'title slug visibility owner');

  if (!message || message.status === 'rejected') {
    throw new CustomError.NotFoundError('Message not found.');
  }

  const board = message.board;
  const isOwner = req.user && board.owner.toString() === userId.toString();

  if (board.visibility === 'private' && !isOwner) {
    throw new CustomError.ForbiddenError('This board is private.');
  }

  if (message.status === 'pending' && !isOwner) {
    throw new CustomError.ForbiddenError('This message is pending approval.');
  }

  res.status(StatusCodes.OK).json({ message });
};


// delete message 
const deleteMessage = async (req, res) => {
  const message = await Message.findById(req.params.id).populate('board', 'owner');

  if (!message) {
    throw new CustomError.NotFoundError('Message not found.');
  }

  const isSender = message.sender.toString() === req.user.userId.toString();
  const isBoardOwner = message.board.owner.toString() === req.user.userId.toString();

  if (!isSender && !isBoardOwner) {
    throw new CustomError.ForbiddenError('You cannot delete this message.');
  }

  await message.deleteOne();

  // Keep board message counter in sync
  await Board.findByIdAndUpdate(message.board._id, { $inc: { 'stats.messages': -1 } });

  res.status(StatusCodes.OK).json({ message: 'Message deleted.' });
};


// moderate message 
const moderateMessage = async (req, res) => {
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    throw new CustomError.BadRequestError('Status must be approved or rejected.');
  }

  const message = await Message.findById(req.params.id).populate('board', 'owner');

  if (!message) {
    throw new CustomError.NotFoundError('Message not found.');
  }

  if (message.board.owner.toString() !== req.user.userId.toString()) {
    throw new CustomError.ForbiddenError('Only the board owner can moderate messages.');
  }

  message.status = status;
  await message.save();

  res.status(StatusCodes.OK).json({ message: `Message ${status}.`, data: message });
};


// get my messages -- sender view 
const getMyMessages = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ sender: req.user.userId })
      .populate('board', 'title slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments({ sender: req.user.userId }),
  ]);

  res.status(StatusCodes.OK).json({
    messages,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};

module.exports = {
  postMessage,
  getBoardMessages,
  getMessage,
  deleteMessage,
  moderateMessage,
  getMyMessages,
};