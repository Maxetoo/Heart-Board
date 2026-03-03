const Message = require('../models/message');
const Board = require('../models/boardModel');
const User = require('../models/userModel');
const CustomError = require('../error');
const { StatusCodes } = require('http-status-codes');

const validateContent = (type, content) => {
  if (type === 'text' && !content?.text) {
    throw new CustomError.BadRequestError('Text messages require content.text.');
  }
  if (type === 'audio' && !content?.audioUrl) {
    throw new CustomError.BadRequestError('Audio messages require content.audioUrl.');
  }
  if (type === 'emblem' && !content?.text && !content?.imageUrls?.length) {
    throw new CustomError.BadRequestError('Emblem messages require text or at least one imageUrl.');
  }
};

const resolveBoard = async (slug, senderId) => {
  const board = await Board.findOne({ slug, isActive: true });
  if (!board) throw new CustomError.NotFoundError('Board not found.');
  if (board.visibility === 'private' && board.owner.toString() !== senderId.toString()) {
    throw new CustomError.ForbiddenError('This board is private.');
  }
  if (!board.canAcceptMessage()) {
    throw new CustomError.BadRequestError(
      `This board has reached its message limit (${board.getMessageLimit()}). The owner needs to upgrade this board.`
    );
  }
  return board;
};



// post message to board
const postMessage = async (req, res) => {
  const { type, content } = req.body;
  const userId = req.user.userId;

  if (!['text', 'audio', 'emblem'].includes(type)) {
    throw new CustomError.BadRequestError('Invalid message type. Must be text, audio, or emblem.');
  }
  validateContent(type, content);

  const board = await resolveBoard(req.params.slug, userId);

  const message = await Message.create({
    context: 'board',
    board:   board._id,
    sender:  userId,
    type,
    content,
  });

  await Board.findByIdAndUpdate(board._id, { $inc: { 'stats.messages': 1 } });

  res.status(StatusCodes.CREATED).json({ message: 'Message posted.', data: message });
};


// get all messages on a board 
const getBoardMessages = async (req, res) => {
  const userId = req.user.userId;
  const board  = await Board.findOne({ slug: req.params.slug, isActive: true });

  if (!board) throw new CustomError.NotFoundError('Board not found.');

  const isOwner = board.owner.toString() === userId.toString();
  if (board.visibility === 'private' && !isOwner) {
    throw new CustomError.ForbiddenError('This board is private.');
  }

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = { context: 'board', board: board._id };
  filter.status = isOwner && req.query.status ? req.query.status : 'approved';
  if (req.query.type) filter.type = req.query.type;

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


// moderate messages on a board 
const moderateBoardMessage = async (req, res) => {
  const { status } = req.body;
  const userId = req.user.userId;

  if (!['approved', 'rejected'].includes(status)) {
    throw new CustomError.BadRequestError('Status must be approved or rejected.');
  }

  const message = await Message.findOne({ _id: req.params.id, context: 'board' })
    .populate('board', 'owner');

  if (!message) throw new CustomError.NotFoundError('Board message not found.');

  if (message.board.owner.toString() !== userId.toString()) {
    throw new CustomError.ForbiddenError('Only the board owner can moderate messages.');
  }

  message.status = status;
  await message.save();

  res.status(StatusCodes.OK).json({ message: `Message ${status}.`, data: message });
};


// Drop a message on another user's personal wall.
const postDirectMessage = async (req, res) => {
  const { type, content } = req.body;
  const senderId = req.user.userId;

  if (!['text', 'audio', 'emblem'].includes(type)) {
    throw new CustomError.BadRequestError('Invalid message type. Must be text, audio, or emblem.');
  }
  validateContent(type, content);

  const recipient = await User.findOne({ username: req.params.username }).select('_id');
  if (!recipient) {
    throw new CustomError.NotFoundError(`User "${req.params.username}" not found.`);
  }
  if (recipient._id.toString() === senderId.toString()) {
    throw new CustomError.BadRequestError('You cannot post a message to your own wall.');
  }

  const message = await Message.create({
    context: 'direct',
    recipient: recipient._id,
    sender: senderId,
    type,
    content,
  });

  res.status(StatusCodes.CREATED).json({ message: 'Message posted to wall.', data: message });
};


// Fetch all messages on a user's personal wall.
const getUserWallMessages = async (req, res) => {
  const userId    = req.user.userId;
  const wallOwner = await User.findOne({ username: req.params.username }).select('_id');

  if (!wallOwner) throw new CustomError.NotFoundError('User not found.');

  const isOwner = wallOwner._id.toString() === userId.toString();

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = { context: 'direct', recipient: wallOwner._id };
  filter.status = isOwner && req.query.status ? req.query.status : 'approved';
  if (req.query.type) filter.type = req.query.type;

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



// Wall owner approves or rejects a direct message on their wall.
const moderateDirectMessage = async (req, res) => {
  const { status } = req.body;
  const userId = req.user.userId;

  if (!['approved', 'rejected'].includes(status)) {
    throw new CustomError.BadRequestError('Status must be approved or rejected.');
  }

  const message = await Message.findOne({ _id: req.params.id, context: 'direct' });
  if (!message) throw new CustomError.NotFoundError('Direct message not found.');

  if (message.recipient.toString() !== userId.toString()) {
    throw new CustomError.ForbiddenError('Only the wall owner can moderate messages on their wall.');
  }

  message.status = status;
  await message.save();

  res.status(StatusCodes.OK).json({ message: `Message ${status}.`, data: message });
};


// get single message by ID
const getMessage = async (req, res) => {
  const userId = req.user.userId;

  const message = await Message.findById(req.params.id)
    .populate('sender', 'username profileImage')
    .populate('recipient', 'username profileImage')
    .populate('board', 'title slug visibility owner');

  if (!message || message.status === 'rejected') {
    throw new CustomError.NotFoundError('Message not found.');
  }

  if (message.context === 'direct') {
    const isSender    = message.sender._id.toString() === userId.toString();
    const isRecipient = message.recipient._id.toString() === userId.toString();
    if (!isSender && !isRecipient) {
      throw new CustomError.ForbiddenError('Access denied.');
    }
    return res.status(StatusCodes.OK).json({ message });
  }

  const board   = message.board;
  const isOwner = board.owner.toString() === userId.toString();
  if (board.visibility === 'private' && !isOwner) {
    throw new CustomError.ForbiddenError('This board is private.');
  }
  if (message.status === 'pending' && !isOwner) {
    throw new CustomError.ForbiddenError('This message is pending approval.');
  }

  res.status(StatusCodes.OK).json({ message });
};


// delete single message by id 
const deleteMessage = async (req, res) => {
  const userId  = req.user.userId;
  const message = await Message.findById(req.params.id).populate('board', 'owner');

  if (!message) throw new CustomError.NotFoundError('Message not found.');

  const isSender = message.sender.toString() === userId.toString();

  if (message.context === 'direct') {
    const isRecipient = message.recipient.toString() === userId.toString();
    if (!isSender && !isRecipient) {
      throw new CustomError.ForbiddenError('You cannot delete this message.');
    }
    await message.deleteOne();
    return res.status(StatusCodes.OK).json({ message: 'Message deleted.' });
  }

  const isBoardOwner = message.board.owner.toString() === userId.toString();
  if (!isSender && !isBoardOwner) {
    throw new CustomError.ForbiddenError('You cannot delete this message.');
  }
  await message.deleteOne();
  await Board.findByIdAndUpdate(message.board._id, { $inc: { 'stats.messages': -1 } });

  res.status(StatusCodes.OK).json({ message: 'Message deleted.' });
};


// get all my messages 
const getMyMessages = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50,  parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = { sender: req.user.userId };
  if (req.query.context) filter.context = req.query.context;

  const [messages, total] = await Promise.all([
    Message.find(filter)
      .populate('board',     'title slug')
      .populate('recipient', 'username profileImage')
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

module.exports = {
  // Board wall
  postMessage,
  getBoardMessages,
  moderateBoardMessage,
  // User personal wall
  postDirectMessage,
  getUserWallMessages,
  moderateDirectMessage,
  // Shared
  getMessage,
  deleteMessage,
  getMyMessages,
};