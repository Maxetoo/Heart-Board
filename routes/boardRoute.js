const express    = require('express');
const BoardRoute = express.Router();

const {
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
} = require('../controllers/boardController');

const { authentication, checkUser} = require('../middlewares/authMiddleware');
const { cache, TTL, keys } = require('../middlewares/cacheMiddleware');


BoardRoute.post('/', authentication, createBoard);


BoardRoute.get(
  '/',
  authentication,
  cache(TTL.MY_BOARDS, req => {
    // Normalise key order so ?view=tagged&page=1 and ?page=1&view=tagged hit the same key
    const p = new URLSearchParams(req.query);
    const sorted = new URLSearchParams([...p.entries()].sort());
    return keys.myBoards(req.user.userId, sorted.toString());
  }),
  getMyBoards
);

// ── Discover feed — cache per sort/page params ────────────────────────────────
BoardRoute.get(
  '/discover',
  checkUser,
  cache(TTL.DISCOVER, req => keys.discover(new URLSearchParams(req.query).toString())),
  discoverBoards
);

BoardRoute.route('/likes/me').get(authentication, getBoardLikes);

// Heart tokens this account has blown at one person. Must sit above /:slug.
BoardRoute.get('/hearts/sent', authentication, getSentHearts);

// The hero radar's pool of recent public hearts. Public — the landing page
// shows it signed out — and cached briefly, since every open tab polls it.
// createBoard busts the key, so a heart blown now appears on the next poll
// rather than waiting out the TTL.
BoardRoute.get(
  '/hearts/recent',
  cache(TTL.RECENT_HEARTS, req => keys.recentHearts(req.query.limit || 'default')),
  getRecentHearts
);

// Hashtag profile — all boards tagged with #tag
BoardRoute.get('/hashtag/:tag', checkUser, getBoardsByHashtag);


BoardRoute.patch( '/:id',       authentication, updateBoard);
BoardRoute.delete('/:id',       authentication, deleteBoard);
BoardRoute.patch( '/:slug/flag',   authentication, flagBoard);
BoardRoute.patch( '/:slug/unflag', authentication, unflagBoard);
BoardRoute.post(  '/:id/like',        authentication, likeBoard);
BoardRoute.get(   '/:id/reaction/me', authentication, getMyReaction);
BoardRoute.patch( '/:id/reaction',    authentication, patchReaction);
BoardRoute.post(  '/:id/share',    authentication, shareBoard);

// ── Single board by slug — cache per slug ─────────────────────────────────────
// MUST be last to avoid matching /:id or /:slug before the named routes above
BoardRoute.get(
  '/:slug',
  checkUser,
  cache(TTL.BOARD, req => keys.board(req.params.slug)),
  getBoardBySlug
);

module.exports = BoardRoute;
