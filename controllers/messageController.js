const Message = require('../models/message');
const Board = require('../models/boardModel');
const User = require('../models/userModel');
const Subscription = require('../models/subscription');
const CustomError = require('../error');
const { canViewBoard } = require('../helpers/boardAccess');
const uploadSendingQueue = require('../workers/uploadAndPostWorker'); 
const { deleteFromCloudinary } = require('../services/cloudinaryUpload');
const { StatusCodes } = require('http-status-codes');
const { moderateText } = require('./aiController');
const { invalidate, invalidatePattern, keys } = require('../middlewares/cacheMiddleware');
const { buildBoardPreview } = require('../helpers/boardPreview');

const validateContent = (type, content) => {
  // Semantic hearts are frontend-owned asset keys, so there is no enum to check
  // against — just keep the array bounded so a client cannot store an unbounded
  // list on the document.
  if (content && content.hearts !== undefined) {
    content.hearts = Array.isArray(content.hearts)
      ? content.hearts.map(String).slice(0, 12)
      : [];
  }
  if (type === 'text' && !content?.text)
    throw new CustomError.BadRequestError('Text messages require content.text.');
  if (type === 'audio' && !content?.audioUrl)
    throw new CustomError.BadRequestError('Audio messages require content.audioUrl.');
  if (type === 'emblem' && !content?.text && !content?.imageUrls?.length)
    throw new CustomError.BadRequestError('Emblem messages require text or at least one imageUrl.');
};

const resolveBoard = async (slug, senderId) => {
  const board = await Board.findOne({ slug, isActive: true });
  if (!board) throw new CustomError.NotFoundError('Board not found.');
  // senderId is null for a guest, who is never the owner — so a guest is
  // refused on private and creator-only boards like any other non-owner.
  // A private board takes messages from its owner and the people it tags.
  const isOwner = Boolean(senderId) && board.owner.toString() === senderId.toString();
  if (!canViewBoard(board, senderId))
    throw new CustomError.ForbiddenError('This board is private.');
  if (board.onlyMe && !isOwner)
    throw new CustomError.ForbiddenError('Only the board creator can add messages to this board.');
  if (!board.canAcceptMessage())
    throw new CustomError.BadRequestError(
      `This board has reached its message limit (${board.getMessageLimit()}). The owner needs to upgrade this board.`
    );
  return board;
};

const checkMonthlyMessageLimit = async (userId) => {
  const subscription = await Subscription.findOne({ user: userId });
  if (!subscription) return;
  const { messageLimit } = subscription.getLimits();
  if (messageLimit === -1) return;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const sentThisMonth = await Message.countDocuments({
    sender:    userId,
    context:   'board',
    createdAt: { $gte: startOfMonth },
  });

  if (sentThisMonth >= messageLimit) {
    throw new CustomError.BadRequestError(
      `You have reached your monthly message limit of ${messageLimit}. Upgrade to Pro for unlimited messages.`
    );
  }
};


/** Every canvasData format's element list (the client writes { v, elements }). */
const canvasElementsOf = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.elements)) return data.elements;
  return [];
};

const canvasTexts = (data) =>
  canvasElementsOf(data)
    .filter((el) => el && el.type === 'text' && typeof el.text === 'string')
    .map((el) => el.text);

/**
 * A guest's canvas with every picture we did not supply removed. Template
 * artwork is served from /templates/ on our own origin and stays; any other URL
 * would let an anonymous visitor hotlink an arbitrary image onto someone's
 * board. An unrecognised shape from an anonymous caller is dropped entirely.
 */
const guestSafeCanvas = (data) => {
  if (!data) return null;
  const keep = (el) =>
    !(el && el.type === 'image') ||
    (typeof el.imageUrl === 'string' && el.imageUrl.startsWith('/templates/'));
  if (Array.isArray(data)) return data.filter(keep);
  if (Array.isArray(data.elements)) return { ...data, elements: data.elements.filter(keep) };
  return null;
};

/**
 * Server-side moderation for guest posts. The browser's check can be skipped
 * by calling this endpoint directly, so for an anonymous poster it has to run
 * here. Same model as /ai/moderate, and the same fail-open rule as that route:
 * an AI outage must not take posting down with it — the guest rate limit is
 * the backstop then.
 */
const moderateGuestText = async (text) => {
  if (!text || !text.trim()) return { isSafe: true };
  try {
    return await moderateText(text.slice(0, 2000));
  } catch (err) {
    console.error('[postMessage] guest moderation unavailable, allowing:', err.message);
    return { isSafe: true };
  }
};

const postMessage = async (req, res) => {
  const { type, content, cloudinaryPublicId, fileType } = req.body;
  let { canvasData } = req.body;
  // Signed-out visitors post as a named guest; the route uses checkUser.
  const userId = req.user?.userId || null;
  const isGuest = !userId;
  const guestName = isGuest
    ? (String(req.body.guestName || '').trim().slice(0, 40) || 'Guest')
    : null;
  let uploadedPublicId = cloudinaryPublicId || null;
  let createdMessage = null;
  let createdBoard = null;

  try {
    if (!['text', 'audio', 'emblem'].includes(type))
      throw new CustomError.BadRequestError('Invalid message type. Must be text, audio, or emblem.');
    validateContent(type, content);

    if (isGuest) {
      // No account means nothing to answer for what is posted, so guests get
      // stricter rules: text only (uploads need an account, and no hotlinked
      // media either), and moderation enforced here rather than trusted.
      if (type !== 'text' || content?.imageUrls?.length || content?.audioUrl || uploadedPublicId) {
        throw new CustomError.BadRequestError('Sign in to add photos or audio to your message.');
      }
      canvasData = guestSafeCanvas(canvasData);
      const verdict = await moderateGuestText(
        [content?.text, ...canvasTexts(canvasData)].filter(Boolean).join('\n'),
      );
      if (!verdict.isSafe) {
        throw new CustomError.BadRequestError(
          verdict.reason || 'Please keep messages positive and kind.',
        );
      }
    } else {
      await checkMonthlyMessageLimit(userId);
    }

    const board = await resolveBoard(req.params.slug, userId);
    createdBoard = board;

    const message = await Message.create({
      context:    'board',
      board:      board._id,
      sender:     userId,
      guestName,
      type,
      content,
      canvasData: canvasData || null,
    });
    createdMessage = message;

    const boardUpdate = { $inc: { 'stats.messages': 1 } };

    // The board's face is its owner's own message. Snapshot it onto the board
    // so feed cards can render the artwork without fetching messages.
    const isBoardFace = !isGuest && board.owner.toString() === userId.toString();
    if (isBoardFace) {
      boardUpdate.$set = { preview: buildBoardPreview(message) };
    }

    await Board.findByIdAndUpdate(board._id, boardUpdate);

    if (uploadedPublicId) {
      try {
        await uploadSendingQueue.add(
          'verify-and-guard',
          { boardId: board._id, messageId: message._id, cloudinaryPublicId: uploadedPublicId, fileType: fileType || 'image' },
          { delay: 3000, attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true, removeOnFail: { age: 86400 } }
        );
      } catch (queueErr) {
        console.error('[postMessage] Failed to enqueue cleanup guard:', queueErr.message);
      }
    }

    const owner = await User.findById(board.owner).select('username').lean();

    await Promise.all([
      invalidatePattern(`boardMsgs:${board.slug}:*`),
      invalidate(keys.board(board.slug)),
      userId ? invalidatePattern(`myMsgs:${userId}:*`) : Promise.resolve(),
      invalidate(keys.profile(board.owner.toString())),
      owner?.username ? invalidate(keys.publicProfile(owner.username.toLowerCase())) : Promise.resolve(),
    ]);

    res.status(StatusCodes.CREATED).json({ message: 'Message posted.', data: message });

  } catch (err) {
    if (uploadedPublicId) {
      try { await deleteFromCloudinary(uploadedPublicId, fileType || 'image'); } catch (e) {}
    }
    if (createdMessage?._id) {
      try {
        await Message.findByIdAndDelete(createdMessage._id);
        await Board.findByIdAndUpdate(createdBoard._id, { $inc: { 'stats.messages': -1 } });
      } catch (e) {}
    }
    throw err;
  }
};


const getBoardMessages = async (req, res) => {
  const userId = req?.user?.userId || '';
  const board = await Board.findOne({ slug: req.params.slug, isActive: true });
  if (!board) throw new CustomError.NotFoundError('Board not found.');

  const isOwner = board.owner.toString() === userId.toString();
  if (!canViewBoard(board, userId))
    throw new CustomError.ForbiddenError('This board is private.');
  // Cached by slug alone — a private board's messages must never be stored.
  if (board.visibility === 'private') res.locals.noCache = true;

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


const moderateBoardMessage = async (req, res) => {
  const { status } = req.body;
  const userId = req.user.userId;

  if (!['approved', 'rejected'].includes(status))
    throw new CustomError.BadRequestError('Status must be approved or rejected.');

  const message = await Message.findOne({ _id: req.params.id, context: 'board' })
    .populate('board', 'owner slug');
  if (!message) throw new CustomError.NotFoundError('Board message not found.');
  if (message.board.owner.toString() !== userId.toString())
    throw new CustomError.ForbiddenError('Only the board owner can moderate messages.');

  message.status = status;
  await message.save();

  await Promise.all([
    invalidatePattern(`boardMsgs:${message.board.slug}:*`),
    invalidate(keys.message(message._id.toString())),
  ]);

  res.status(StatusCodes.OK).json({ message: `Message ${status}.`, data: message });
};


const postDirectMessage = async (req, res) => {
  const { type, content } = req.body;
  const senderId = req.user.userId;

  if (!['text', 'audio', 'emblem'].includes(type))
    throw new CustomError.BadRequestError('Invalid message type. Must be text, audio, or emblem.');
  validateContent(type, content);

  const recipient = await User.findOne({ username: req.params.username }).select('_id');
  if (!recipient)
    throw new CustomError.NotFoundError(`User "${req.params.username}" not found.`);
  if (recipient._id.toString() === senderId.toString())
    throw new CustomError.BadRequestError('You cannot post a message to your own wall.');

  const message = await Message.create({
    context:   'direct',
    recipient: recipient._id,
    sender:    senderId,
    type,
    content,
  });

  await Promise.all([
    invalidatePattern(`wallMsgs:${req.params.username}:*`),
    invalidatePattern(`myMsgs:${senderId}:*`),
  ]);

  res.status(StatusCodes.CREATED).json({ message: 'Message posted to wall.', data: message });
};


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


const moderateDirectMessage = async (req, res) => {
  const { status } = req.body;
  const userId = req.user.userId;

  if (!['approved', 'rejected'].includes(status))
    throw new CustomError.BadRequestError('Status must be approved or rejected.');

  const message = await Message.findOne({ _id: req.params.id, context: 'direct' });
  if (!message) throw new CustomError.NotFoundError('Direct message not found.');
  if (message.recipient.toString() !== userId.toString())
    throw new CustomError.ForbiddenError('Only the wall owner can moderate messages on their wall.');

  message.status = status;
  await message.save();

  await invalidate(keys.message(message._id.toString()));

  res.status(StatusCodes.OK).json({ message: `Message ${status}.`, data: message });
};


const getMessage = async (req, res) => {
  const userId = req.user.userId;

  const message = await Message.findById(req.params.id)
    .populate('sender',    'username profileImage')
    .populate('recipient', 'username profileImage')
    .populate('board',     'title slug visibility owner receipent receipentOriginal taggedUsers');

  if (!message || message.status === 'rejected')
    throw new CustomError.NotFoundError('Message not found.');

  if (message.context === 'direct') {
    const isSender    = message.sender._id.toString() === userId.toString();
    const isRecipient = message.recipient._id.toString() === userId.toString();
    if (!isSender && !isRecipient) throw new CustomError.ForbiddenError('Access denied.');
    return res.status(StatusCodes.OK).json({ message });
  }

  const board   = message.board;
  const isOwner = board.owner.toString() === userId.toString();
  if (!canViewBoard(board, userId)) throw new CustomError.ForbiddenError('This board is private.');
  if (board.visibility === 'private') res.locals.noCache = true;
  if (message.status === 'pending' && !isOwner)   throw new CustomError.ForbiddenError('This message is pending approval.');

  res.status(StatusCodes.OK).json({ message });
};


const deleteMessage = async (req, res) => {
  const userId  = req.user.userId;
  const message = await Message.findById(req.params.id).populate('board', 'owner slug receipent');
  if (!message) throw new CustomError.NotFoundError('Message not found.');

  // A guest's message has no sender; only the board owner can remove it.
  const isSender = Boolean(message.sender) && message.sender.toString() === userId.toString();

  if (message.context === 'direct') {
    const isRecipient = message.recipient.toString() === userId.toString();
    if (!isSender && !isRecipient) throw new CustomError.ForbiddenError('You cannot delete this message.');
    await message.deleteOne();
    await Promise.all([
      invalidate(keys.message(req.params.id)),
      invalidatePattern(`myMsgs:${userId}:*`),
    ]);
    return res.status(StatusCodes.OK).json({ message: 'Message deleted.' });
  }

  const isBoardOwner = message.board.owner.toString() === userId.toString();
  if (!isSender && !isBoardOwner) throw new CustomError.ForbiddenError('You cannot delete this message.');

  const boardId    = message.board._id;
  const boardSlug  = message.board.slug;
  const boardOwner = message.board.owner.toString();
  const receipentId = message.board.receipent?.toString() ?? null;

  await message.deleteOne();

  const remaining = await Message.countDocuments({ board: boardId, status: { $ne: 'rejected' } });

  let boardDeleted = false;
  if (remaining === 0) {
    await Board.findByIdAndUpdate(boardId, { isActive: false, 'stats.messages': 0 });
    boardDeleted = true;
  } else {
    await Board.findByIdAndUpdate(boardId, { $inc: { 'stats.messages': -1 } });
  }

  const owner = await User.findById(boardOwner).select('username').lean();

  const invalidations = [
    invalidate(keys.message(req.params.id)),
    invalidatePattern(`boardMsgs:${boardSlug}:*`),
    invalidate(keys.board(boardSlug)),
    invalidatePattern(`myMsgs:${userId}:*`),
    invalidate(keys.profile(boardOwner)),
    owner?.username ? invalidate(keys.publicProfile(owner.username.toLowerCase())) : Promise.resolve(),
  ];
  if (boardDeleted) {
    invalidations.push(invalidatePattern(`myBoards:${boardOwner}:*`));
    invalidations.push(invalidatePattern('discover:*'));
    if (receipentId) invalidations.push(invalidatePattern(`myBoards:${receipentId}:*`));
  }
  await Promise.all(invalidations);

  res.status(StatusCodes.OK).json({ message: 'Message deleted.', boardDeleted });
};


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


const editMessage = async (req, res) => {
  const { content, canvasData } = req.body;
  const userId = req.user.userId;

  const message = await Message.findById(req.params.id).populate('board', 'slug');
  if (!message) throw new CustomError.NotFoundError('Message not found.');
  if (!message.sender || message.sender.toString() !== userId.toString())
    throw new CustomError.ForbiddenError('Only the original sender can edit this message.');

  validateContent(message.type, content);

  message.content    = content;
  message.canvasData = canvasData ?? message.canvasData;
  message.isEdited   = true;
  await message.save();

  // Keep the board's denormalised preview in step with its face message.
  if (message.context === 'board' && message.board?._id) {
    const boardDoc = await Board.findById(message.board._id).select('owner').lean();
    if (boardDoc && boardDoc.owner.toString() === userId.toString()) {
      await Board.findByIdAndUpdate(message.board._id, {
        $set: { preview: buildBoardPreview(message) },
      });
    }
  }

  const invalidations = [invalidate(keys.message(req.params.id))];
  if (message.context === 'board' && message.board?.slug)
    invalidations.push(invalidatePattern(`boardMsgs:${message.board.slug}:*`));
  if (message.context === 'direct')
    invalidations.push(invalidatePattern(`myMsgs:${userId}:*`));
  await Promise.all(invalidations);

  res.status(StatusCodes.OK).json({ message: 'Message updated.', data: message });
};


module.exports = {
  postMessage,
  getBoardMessages,
  moderateBoardMessage,
  postDirectMessage,
  getUserWallMessages,
  moderateDirectMessage,
  getMessage,
  deleteMessage,
  getMyMessages,
  editMessage,
};