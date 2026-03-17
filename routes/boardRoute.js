const express    = require('express');
const BoardRoute = express.Router();

const {
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
  getBoardLikes
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


BoardRoute.patch( '/:id',       authentication, updateBoard);
BoardRoute.delete('/:id',       authentication, deleteBoard);
BoardRoute.patch( '/:slug/flag',   authentication, flagBoard);
BoardRoute.patch( '/:slug/unflag', authentication, unflagBoard);
BoardRoute.post(  '/:id/like',     authentication, likeBoard);
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
