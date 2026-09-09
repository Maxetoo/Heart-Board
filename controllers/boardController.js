const mongoose = require('mongoose');
const User = require('../models/userModel');
const Board = require('../models/boardModel');
const Message = require('../models/message');
const Subscription = require('../models/subscription');
const Sponsorship = require('../models/sponsporship');
const Like = require('../models/boardLikeModel');
const CustomError = require('../error');
const { StatusCodes } = require('http-status-codes');
const { invalidate, invalidatePattern, keys } = require('../middlewares/cacheMiddleware');

const VALID_REACTIONS = ['clap', 'heart', 'thumbs', 'smile', 'sad', 'fire'];

/**
 * Restricts a board query to one kind.
 *
 * Heart tokens are boards underneath, but they are NOT boards to the product:
 * they belong on the two Heartboard profile tabs and nowhere else. Every board
 * listing therefore excludes them unless it explicitly asks for them with
 * ?kind=heart. Legacy rows have no `kind` field at all, which $ne matches — so
 * they stay boards, which is what they are.
 */
const kindFilter = (kind) => (kind === 'heart' ? { kind: 'heart' } : { kind: { $ne: 'heart' } });

/**
 * Boards a user has WRITTEN ON — the Collaboration tab.
 *
 * "Collaboration" means someone else made the board and you left a message on
 * it. There is no field on Board recording that, because the record of it is
 * the message itself, so the ids have to come from the Message collection.
 *
 * Aggregate rather than .distinct(): the app connects with apiStrict under
 * Stable API v1, where distinct is not available.
 */
const collaboratedBoardIds = async (userId) => {
  const rows = await Message.aggregate([
    {
      $match: {
        sender:  new mongoose.Types.ObjectId(userId.toString()),
        context: 'board',
        board:   { $ne: null },
      },
    },
    { $group: { _id: '$board' } },
  ]);
  return rows.map((r) => r._id);
};

/**
 * Per-reaction totals for a page of boards, in one aggregate.
 *
 * Deliberately viewer-INDEPENDENT. /discover and /:slug are cached with no
 * viewer in the key, so a "did I react" flag riding along here would be served
 * to whoever asked next. The caller's own reactions come from
 * GET /board/likes/me, which is authenticated and uncached.
 *
 * Returns a Map keyed by board id: { clap: 3, fire: 1, ... }.
 */
const reactionCountsFor = async (boardIds) => {
  const ids = (boardIds || []).filter(Boolean);
  if (!ids.length) return new Map();

  const rows = await Like.aggregate([
    { $match: { board: { $in: ids } } },
    {
      // Exactly ONE reaction counted per person, so a board's total is the
      // number of people who reacted to it. Only the first entry is read: a row
      // written while the client still allowed several would otherwise be
      // counted once in each of them. Rows predating `reactions` carry
      // `reaction` alone.
      $project: {
        board: 1,
        picked: { $ifNull: [{ $arrayElemAt: ['$reactions', 0] }, '$reaction'] },
      },
    },
    { $match: { picked: { $ne: null } } },
    { $group: { _id: { board: '$board', reaction: '$picked' }, count: { $sum: 1 } } },
  ]);

  const byBoard = new Map();
  rows.forEach(({ _id, count }) => {
    const key = _id.board.toString();
    if (!byBoard.has(key)) byBoard.set(key, {});
    byBoard.get(key)[_id.reaction] = count;
  });
  return byBoard;
};

/** Stamps `reactionCounts` onto a list of PLAIN board objects (.lean()/.toObject()). */
const attachReactionCounts = async (boards) => {
  const counts = await reactionCountsFor(boards.map((b) => b._id));
  boards.forEach((b) => {
    b.reactionCounts = counts.get(b._id.toString()) || {};
  });
  return boards;
};

const requireBoardOwner = async (res, boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board || !board.isActive) throw new CustomError.NotFoundError('Board not found.');
  if (board.owner.toString() !== userId.toString()) throw new CustomError.UnauthorizedError('You do not own this board.');
  return board;
};


const createBoard = async (req, res) => {
  const userId = req.user.userId;
  const { title, description, visibility, receipent, event, coverImage, tags, coverImagePublicId, onlyMe, style, kind } = req.body;
  const boardKind = kind === 'heart' ? 'heart' : 'board';
  let createdBoard = null;

  try {
    // Accounts created before subscriptions existed (and any user whose
    // Subscription document was lost) have none. Fall back to free-plan limits
    // instead of throwing on `null.getLimits()`.
    let subscription = await Subscription.findOne({ user: userId });
    if (!subscription) {
      subscription = await Subscription.create({ user: userId });
    }
    const limits = subscription.getLimits();

    // Heart tokens are boards underneath, but they are not what the plan sells
    // — blowing twenty hearts must not exhaust a free account's twenty boards.
    if (limits.boardLimit !== -1 && boardKind !== 'heart') {
      const boardCount = await Board.countDocuments({ owner: userId, isActive: true, kind: { $ne: 'heart' } });
      if (boardCount >= limits.boardLimit) {
        throw new CustomError.BadRequestError(
          `Your ${subscription.plan} plan allows a maximum of ${limits.boardLimit} boards. Upgrade to create more.`
        );
      }
    }

    let receipentId       = null;
    let receipentHashtag  = null;
    let receipentUsername = null;

    if (receipent?.length > 0 && receipent.trim()) {
      const raw = receipent.trim();
      if (raw.startsWith('#')) {
        // Hashtag receipent — store as string, no user lookup
        receipentHashtag = raw.slice(1).toLowerCase();
      } else {
        const receipentUser = await User.findOne({ username: raw.toLowerCase() });
        if (!receipentUser) throw new CustomError.BadRequestError('Receipent user not found.');
        receipentId       = receipentUser._id;
        receipentUsername = receipentUser.username;
      }
    }

    // One heart per category per pair of people.
    //
    // A "Loving" heart is a statement, not a tally: you have either given this
    // person one or you have not. Blowing the same category twice — from the
    // composer, or by double-tapping the profile heart — returns the token that
    // already exists rather than stacking duplicates, which is also what makes
    // the profile heart button a true toggle.
    if (boardKind === 'heart' && receipentId) {
      const heartId = Array.isArray(style?.hearts) && style.hearts.length ? String(style.hearts[0]) : null;
      if (heartId) {
        const existingHeart = await Board.findOne({
          owner:            userId,
          receipent:        receipentId,
          kind:             'heart',
          isActive:         true,
          'style.hearts':   heartId,
        });
        if (existingHeart) {
          return res.status(StatusCodes.OK).json({
            message:     'Heart already sent.',
            alreadySent: true,
            board:       existingHeart,
          });
        }
      }
    }

    const board = await Board.create({
      owner:            userId,
      title,
      description,
      event,
      kind:             boardKind,
      visibility:       visibility || 'public',
      receipent:        receipentId,
      // Schema field the tagged queries were written against but which nothing
      // ever set. Populated from here on so it stops being dead.
      receipentOriginal: receipentId,
      receipentHashtag: receipentHashtag,
      coverImage:       coverImage || null,
      tags:             Array.isArray(tags) ? tags : [],
      onlyMe:           onlyMe === true || onlyMe === 'true',
      style: {
        theme:    style?.theme    ?? null,
        sticker:  style?.sticker  ?? null,
        confetti: style?.confetti ?? null,
        hearts:   Array.isArray(style?.hearts) ? style.hearts.map(String).slice(0, 12) : [],
      },
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
    if (receipentUsername) {
      // A heart lands on the RECIPIENT's Heartboard, so their public profile is
      // the response that just went stale — including its ?view/?kind variants.
      invalidations.push(invalidatePattern(`${keys.publicProfile(receipentUsername.toLowerCase())}*`));
    }
    if (receipentHashtag) {
      invalidations.push(invalidatePattern(`hashtag:${receipentHashtag}:*`));
    }
    if (boardKind === 'heart' && visibility !== 'private') {
      // The hero radar's pool. Dropping it here is what makes a heart blown
      // right now show up on everyone's radar on their next poll, rather than
      // waiting out the TTL.
      invalidations.push(invalidatePattern('recentHearts:*'));
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
  const { view = 'owned', tier, visibility, status, event, kind } = req.query;

  if (!['owned', 'tagged', 'collaboration'].includes(view)) {
    throw new CustomError.BadRequestError('view must be owned, tagged or collaboration.');
  }

  let filter;
  if (view === 'tagged') {
    // Boards SOMEONE ELSE addressed to this account. A board the account both
    // owns and addressed to itself belongs under Board, never Tagged.
    filter = {
      $or:              [{ receipent: userId }, { receipentOriginal: userId }],
      owner:            { $ne: userId },
      receipentFlagged: false,
      isActive:         true,
    };
  } else if (view === 'collaboration') {
    // Boards this account has left a MESSAGE on, made by somebody else.
    //
    // The client used to build this tab by filtering whichever boards happened
    // to be loaded — the discover feed — for a contributor whose name matched.
    // A board you wrote on is not in that list except by coincidence, so the
    // tab was empty for almost everyone.
    //
    // Private boards are excluded: contributing to one does not grant access,
    // and GET /board/:slug would refuse the card the moment it was opened.
    filter = {
      _id:        { $in: await collaboratedBoardIds(userId) },
      owner:      { $ne: userId },
      isActive:   true,
      visibility: { $ne: 'private' },
    };
  } else {
    filter = { owner: userId };
    if (status === 'inactive') filter.isActive = false;
    else if (status !== 'all') filter.isActive = true;
  }

  if (tier)       filter.tier       = tier;
  if (visibility) filter.visibility = visibility;
  if (event)      filter.event      = event;
  Object.assign(filter, kindFilter(kind));

  // Both views need the owner (the Board tab renders the card's author, and on
  // the Tagged tab the owner is the person who made you the recipient), and the
  // recipient — without it the client cannot label who a board is addressed to,
  // and its avatar fell through to a name-seeded stand-in.
  const query = Board.find(filter)
    .populate('owner', 'username displayName profileImage')
    .populate('receipent', 'username displayName profileImage');

  const [boards, total] = await Promise.all([
    query
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title description slug stats tier tags kind visibility event isActive receipentFlagged receiprentFlagReason owner receipent receipentHashtag coverImage style preview createdAt')
      .lean(),
    Board.countDocuments(filter),
  ]);

  await attachReactionCounts(boards);

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
  await attachReactionCounts([boardObj]);

  res.status(StatusCodes.OK).json({ board: boardObj, sponsors });
};


const updateBoard = async (req, res) => {
  const { id } = req.params;
  const board  = await requireBoardOwner(res, id, req.user.userId);
  if (!board) return;

  const { title, description, visibility, coverImage, style, event, tags } = req.body;
  if (title       !== undefined) board.title       = title;
  if (description !== undefined) board.description = description;
  if (visibility  !== undefined) board.visibility  = visibility;
  if (coverImage  !== undefined) board.coverImage  = coverImage;
  if (event       !== undefined) board.event       = event;
  if (Array.isArray(tags))       board.tags        = tags;

  // The composer has always sent style, event and tags on an edit; this handler
  // destructured only the first four fields and dropped the rest on the floor.
  // The board then reverted to its old background on the next load, while the
  // client's optimistic update made the change look like it had stuck.
  //
  // Merged field by field rather than replaced, so sending only { theme } does
  // not blank out the sticker and confetti alongside it.
  if (style && typeof style === 'object') {
    if (style.theme    !== undefined) board.style.theme    = style.theme ?? null;
    if (style.sticker  !== undefined) board.style.sticker  = style.sticker ?? null;
    if (style.confetti !== undefined) board.style.confetti = style.confetti ?? null;
    if (style.hearts   !== undefined) {
      board.style.hearts = Array.isArray(style.hearts) ? style.hearts.map(String).slice(0, 12) : [];
    }
  }

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

  const [owner, recipient] = await Promise.all([
    User.findById(userId).select('username').lean(),
    receipentId ? User.findById(receipentId).select('username').lean() : null,
  ]);

  const invalidations = [
    invalidate(keys.board(board.slug)),
    invalidatePattern(`myBoards:${userId}:*`),
    invalidatePattern(`boardMsgs:${board.slug}:*`),
    invalidatePattern('discover:*'),
    invalidate(keys.profile(userId)),
    // Pattern, not an exact key: the public profile is cached per ?view/?kind
    // as well, and un-hearting someone has to clear the heart variants too.
    owner?.username
      ? invalidatePattern(`${keys.publicProfile(owner.username.toLowerCase())}*`)
      : Promise.resolve(),
  ];
  if (receipentId) {
    invalidations.push(invalidatePattern(`myBoards:${receipentId}:*`));
  }
  if (recipient?.username) {
    invalidations.push(invalidatePattern(`${keys.publicProfile(recipient.username.toLowerCase())}*`));
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


/**
 * What this user has on the board: one reaction, or none.
 *
 * Still returned as a list because that is the shape the client reads, but
 * capped at one — matching the single-reaction rule, and matching how the
 * counts above are aggregated. Old rows carry `reaction` alone.
 */
const reactionsOf = (like) => {
  if (!like) return [];
  if (Array.isArray(like.reactions) && like.reactions.length) return [like.reactions[0]];
  return like.reaction ? [like.reaction] : [];
};

const getMyReaction = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const like = await Like.findOne({ board: id, user: userId }).select('reaction reactions').lean();
  const reactions = reactionsOf(like);
  res.status(StatusCodes.OK).json({ reaction: reactions[0] || null, reactions });
};


/**
 * Sets this user's reaction on a board to exactly what was sent.
 *
 * ONE reaction per person per board — the extra entries of a longer list are
 * dropped here rather than trusted, so the rule holds whatever the caller
 * sends. Sending an empty list (or nothing) clears it.
 *
 * It also UPSERTS: it used to 404 unless a Like row already existed, which
 * meant a first reaction could never be stored — the client papered over that
 * by calling the like toggle instead, so picking a second reaction silently
 * un-liked the board.
 *
 * Clearing removes the row, keeping stats.likes meaning "people who reacted".
 */
const patchReaction = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const { reaction, reactions } = req.body;

  const incoming = Array.isArray(reactions) ? reactions : reaction ? [reaction] : [];
  const next = [...new Set(incoming.map(String))].slice(0, 1);
  if (next.some((r) => !VALID_REACTIONS.includes(r))) {
    throw new CustomError.BadRequestError('Invalid reaction type');
  }

  const board = await Board.findById(id);
  if (!board || !board.isActive) throw new CustomError.NotFoundError('Board not found');

  const existing = await Like.findOne({ board: id, user: userId });

  if (!next.length) {
    if (existing) {
      await existing.deleteOne();
      board.stats.likes = Math.max(0, (board.stats.likes || 0) - 1);
      board.lastReaction = null;
      await board.save();
    }
  } else if (existing) {
    existing.reactions = next;
    existing.reaction  = next[0];
    await existing.save();
    board.lastReaction = next[0];
    await board.save();
  } else {
    try {
      // create(), not findOneAndUpdate(): the Like model's save hook is what
      // recalculates the board owner's stats.
      await Like.create({ board: id, user: userId, reaction: next[0], reactions: next });
      board.stats.likes = (board.stats.likes || 0) + 1;
    } catch (err) {
      // Two rapid taps can both miss the findOne above; the unique index then
      // rejects the second. The row exists either way — update it, and do NOT
      // count the board as newly liked.
      if (err?.code !== 11000) throw err;
      await Like.updateOne({ board: id, user: userId }, { $set: { reaction: next[0], reactions: next } });
    }
    board.lastReaction = next[0];
    await board.save();
  }

  const counts = (await reactionCountsFor([board._id])).get(board._id.toString()) || {};
  await invalidate(keys.board(board.slug));

  res.status(StatusCodes.OK).json({
    reaction:       next[0] || null,
    reactions:      next,
    lastReaction:   next[0] || null,
    reactionCounts: counts,
    likeCount:      board.stats.likes,
  });
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
  const sortMap = {
    popular:  { 'stats.visits':   -1 },
    likes:    { 'stats.likes':    -1 },
    shares:   { 'stats.shares':   -1 },
    messages: { 'stats.messages': -1 },
  }
  const sort = sortMap[req.query.sort] || { createdAt: -1 };

  // Heart tokens never reach the discover feed — they are profile content, not
  // boards, and a wall of "Loving Heart 💛" rows would bury the real ones.
  const filter = { visibility: 'public', isActive: true, receipentFlagged: false, ...kindFilter() };
  if (req.query.event) filter.event = req.query.event;

  const [boards, total] = await Promise.all([
    Board.find(filter)
      .populate('owner', 'username profileImage')
      .populate('receipent', 'username displayName profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('title description slug stats tier kind owner receipent receipentHashtag coverImage event style preview createdAt')
      .lean(),
    Board.countDocuments(filter),
  ]);

  await attachReactionCounts(boards);

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


/**
 * Everything this account has reacted to.
 *
 * `reactions` is the viewer-dependent half of the reaction state: /discover and
 * /:slug are cached with no viewer in the key and can only carry the totals, so
 * "which ones did I pick" has to come from here. Without it a reaction rendered
 * as un-picked after every refresh even though it was stored.
 */
const getBoardLikes = async (req, res) => {
  const userId = req.user.userId;
  const likes  = await Like.find({ user: userId }).select('board reaction reactions').lean();

  const reactions = {};
  likes.forEach((l) => {
    const picked = reactionsOf(l);
    if (picked.length) reactions[l.board.toString()] = picked;
  });

  res.status(StatusCodes.OK).json({
    likedBoardIds: likes.map(l => l.board.toString()),
    reactions,
  });
};


/**
 * Which heart categories the caller has already blown at one person.
 *
 * The profile heart button is a toggle over exactly this: it fills when a
 * 'loving' token from you to them exists, and clicking it again deletes that
 * token. Answering from the full board list would mean paging through
 * everything the caller has ever made just to colour one button.
 */
/**
 * The most recent PUBLIC hearts blown on the platform, for the hero radar.
 *
 * Returns a POOL rather than a single latest item, deliberately. The ticker
 * shows one line at a time on a fixed cadence and picks from this at random, so
 * a burst of activity changes WHAT is on screen but never how fast it moves.
 * Handing the client one "newest" heart would have tied the display rate to the
 * blow rate, which is exactly the flicker to avoid.
 *
 * Shaped for the ticker rather than returned as raw boards: it needs two names,
 * two handles and a heart id, and nothing else.
 */
const getRecentHearts = async (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit) || 25);

  const boards = await Board.find({
    kind:             'heart',
    isActive:         true,
    visibility:       'public',
    receipentFlagged: false,
    receipent:        { $ne: null },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('owner', 'username displayName')
    .populate('receipent', 'username displayName')
    .select('slug style owner receipent createdAt')
    .lean();

  const person = (u) =>
    u && u.username
      ? { name: u.displayName || u.username, username: u.username }
      : null;

  res.status(StatusCodes.OK).json({
    hearts: boards
      .map((b) => ({
        id:        b._id,
        heart:     b.style?.hearts?.[0] ?? null,
        createdAt: b.createdAt,
        sender:    person(b.owner),
        recipient: person(b.receipent),
      }))
      // Both ends must be nameable or the line reads "blew a heart to".
      .filter((h) => h.sender && h.recipient),
  });
};


const getSentHearts = async (req, res) => {
  const userId = req.user.userId;
  const to     = (req.query.to || '').trim().toLowerCase();
  if (!to) throw new CustomError.BadRequestError('A recipient username is required.');

  const recipient = await User.findOne({ username: to }).select('_id').lean();
  if (!recipient) return res.status(StatusCodes.OK).json({ hearts: [] });

  const boards = await Board.find({
    owner:     userId,
    receipent: recipient._id,
    kind:      'heart',
    isActive:  true,
  })
    .select('slug style createdAt')
    .lean();

  res.status(StatusCodes.OK).json({
    hearts: boards.map((b) => ({
      _id:       b._id,
      slug:      b.slug,
      heart:     b.style?.hearts?.[0] ?? null,
      createdAt: b.createdAt,
    })),
  });
};


const getBoardsByHashtag = async (req, res) => {
  const tag   = req.params.tag?.toLowerCase();
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  if (!tag) throw new CustomError.BadRequestError('Hashtag is required.');

  // A board reaches a hashtag page two ways: it was addressed TO the hashtag
  // (receipentHashtag), or it carries the tag in its tags array. Matching only
  // the former hid every board tagged through the normal create flow.
  //
  // Visibility: the schema enum is public | private | anonymous. The previous
  // filter looked for a 'link-only' value that does not exist, and excluded
  // 'anonymous' boards, which are publicly readable — only the author is hidden.
  const filter = {
    isActive:   true,
    visibility: { $in: ['public', 'anonymous'] },
    $or: [{ receipentHashtag: tag }, { tags: tag }],
    ...kindFilter(),
  };

  const [boards, total] = await Promise.all([
    Board.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      // User has `profileImage`, not `avatar` — the old projection always
      // returned owners without a picture.
      .populate('owner', 'username displayName profileImage isVerified')
      .select('title description slug stats tier tags kind owner coverImage event style preview createdAt')
      .lean(),
    Board.countDocuments(filter),
  ]);

  await attachReactionCounts(boards);

  res.status(StatusCodes.OK).json({ boards, total, page, pages: Math.ceil(total / limit) });
};


module.exports = {
  createBoard,
  getMyBoards,
  getBoardBySlug,
  updateBoard,
  deleteBoard,
  likeBoard,
  getMyReaction,
  patchReaction,
  shareBoard,
  discoverBoards,
  flagBoard,
  unflagBoard,
  getBoardLikes,
  getSentHearts,
  getRecentHearts,
  getBoardsByHashtag,
};