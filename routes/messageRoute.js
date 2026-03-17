const express      = require('express');
const MessageRoute = express.Router();

const {
  editMessage,
  postMessage,
  getBoardMessages,
  moderateBoardMessage,
  postDirectMessage,
  getUserWallMessages,
  moderateDirectMessage,
  getMessage,
  deleteMessage,
  getMyMessages,
} = require('../controllers/messageController');

const { authentication, checkUser} = require('../middlewares/authMiddleware');
const { cache, TTL, keys } = require('../middlewares/cacheMiddleware');

const sortedQS = (query) => {
  const p = new URLSearchParams(query);
  return new URLSearchParams([...p.entries()].sort()).toString();
};

MessageRoute.get(
  '/mine',
  authentication,
  cache(TTL.MY_MESSAGES, req => keys.myMessages(req.user.userId, sortedQS(req.query))),
  getMyMessages
);

MessageRoute.get(
  '/:slug/board',
  checkUser,
  cache(TTL.BOARD_MESSAGES, req => keys.boardMessages(req.params.slug, sortedQS(req.query))),
  getBoardMessages
);

MessageRoute.post('/:slug', authentication, postMessage);

MessageRoute.patch('/:id/board/moderate',  authentication, moderateBoardMessage);
MessageRoute.patch('/:id/direct/moderate', authentication, moderateDirectMessage); 

MessageRoute.get(
  '/:id',
  authentication,
  cache(TTL.MESSAGE, req => keys.message(req.params.id)),
  getMessage
);

MessageRoute.delete('/:id', authentication, deleteMessage);
MessageRoute.patch( '/:id', authentication, editMessage);

MessageRoute.post('/:username', authentication, postDirectMessage);
MessageRoute.get(
  '/:username',
  authentication,
  cache(TTL.MY_MESSAGES, req => `wallMsgs:${req.params.username}:${new URLSearchParams(req.query).toString()}`),
  getUserWallMessages
);

module.exports = MessageRoute;