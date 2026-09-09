const { StatusCodes } = require('http-status-codes');
const User    = require('../models/userModel');
const Board   = require('../models/boardModel');
const Message = require('../models/message');

/**
 * Escapes user input before it is used inside a RegExp, so a query like
 * "c++" or ".*" cannot blow up or turn into a catastrophic backtracking match.
 */
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/v1/search?q=&type=all|users|boards|hashtags&limit=
 *
 * Public search across users, boards and hashtags. Replaces the client-side
 * filtering of a hard-coded user list in the old prototype frontend.
 *
 * Only public, active boards are searchable. Private and anonymous boards are
 * excluded regardless of who is asking.
 */
const search = async (req, res) => {
  const q     = (req.query.q || '').trim();
  const type  = req.query.type || 'all';
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);

  // Browse mode.
  //
  // A query under two characters used to return three empty arrays, so opening
  // the search panel showed nothing at all under People and Hashtags until you
  // guessed a name — there was no way to discover either. With no query we
  // return the most active accounts and the most used tags instead, which is
  // what the panel's "Recent users" and "Hashtag" sections were always
  // captioned for. Everything returned here is already public: the same fields
  // this endpoint returns for a typed query.
  const browsing = q.length < 2;
  const rx = browsing ? null : new RegExp(escapeRegex(q.replace(/^[@#]/, '')), 'i');

  const wantUsers    = type === 'all' || type === 'users';
  const wantBoards   = type === 'all' || type === 'boards';
  const wantHashtags = type === 'all' || type === 'hashtags';

  const [users, boards, hashtagAgg] = await Promise.all([
    wantUsers
      ? User.find({
          username: { $exists: true, $ne: null },
          // Browsing matches everyone with a handle; the ordering below is what
          // decides who is worth showing first.
          ...(browsing ? {} : { $or: [{ username: rx }, { displayName: rx }, { bio: rx }] }),
        })
          .select('username displayName profileImage bio isVerified stats')
          // Most active curators first when browsing, so the panel opens on
          // people who have actually made something.
          .sort(browsing ? { 'stats.totalBoards': -1, createdAt: -1 } : { createdAt: -1 })
          .limit(limit)
          .lean()
      : [],

    wantBoards
      ? Board.find({
          isActive: true,
          visibility: 'public',
          // A heart token is stored as a board but is not one, and searching
          // for a name would otherwise return every "Loving Heart 💛" ever
          // blown at that person alongside their actual boards.
          kind: { $ne: 'heart' },
          ...(browsing ? {} : { $or: [{ title: rx }, { description: rx }, { tags: rx }] }),
        })
          .populate('owner', 'username displayName profileImage isVerified')
          .select('title description slug stats tier owner coverImage event tags style preview createdAt')
          .sort({ 'stats.likes': -1, createdAt: -1 })
          .limit(limit)
          .lean()
      : [],

    wantHashtags
      ? Board.aggregate([
          {
            $match: {
              isActive: true,
              visibility: 'public',
              kind: { $ne: 'heart' },
              ...(browsing ? { tags: { $exists: true, $ne: [] } } : { tags: rx }),
            },
          },
          { $unwind: '$tags' },
          // Second pass: $unwind flattens the array, so without this a board
          // that matched on one tag would contribute all of its others too.
          // Browsing has nothing to narrow to, so every tag counts.
          ...(browsing ? [] : [{ $match: { tags: rx } }]),
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit },
        ])
      : [],
  ]);

  res.status(StatusCodes.OK).json({
    query: q,
    users,
    boards,
    hashtags: hashtagAgg.map((h) => ({ tag: h._id, count: h.count })),
  });
};

/**
 * GET /api/v1/stats
 *
 * Real platform totals. Replaces the fabricated counters the prototype
 * rendered (a hard-coded 7.6M reactions plus a random ticker).
 */
const globalStats = async (req, res) => {
  const [totalBoards, totalMessages, curatorAgg, reactionAgg] = await Promise.all([
    // Heart tokens are boards underneath; counting them would overstate how
    // many boards the platform has by however many hearts have been blown.
    Board.countDocuments({ isActive: true, visibility: 'public', kind: { $ne: 'heart' } }),
    Message.countDocuments({ context: 'board' }),
    Message.aggregate([
      { $match: { context: 'board' } },
      { $group: { _id: '$sender' } },
      { $count: 'total' },
    ]),
    Board.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$stats.likes' } } },
    ]),
  ]);

  res.status(StatusCodes.OK).json({
    totalBoards,
    totalMessages,
    totalCurators:  curatorAgg[0]?.total ?? 0,
    totalReactions: reactionAgg[0]?.total ?? 0,
  });
};

module.exports = { search, globalStats };
