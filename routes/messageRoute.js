const express = require('express');
const MessageRoute = express.Router();
const {

    postMessage,
    getBoardMessages,
    moderateBoardMessage,
    postDirectMessage,
    getUserWallMessages,
    moderateDirectMessage,
    getMessage,
    deleteMessage,
    getMyMessages,

} = require('../controllers/messageController')
const { authentication } = require('../middlewares/authMiddleware');

// board messages routes
MessageRoute.route('/:slug').post(authentication, postMessage);
MessageRoute.route('/:slug/board').get(authentication, getBoardMessages);
MessageRoute.route('/:id/board/moderate').patch(authentication, moderateBoardMessage);

// user personal wall routes
MessageRoute.route('/:username').post(authentication, postDirectMessage);
MessageRoute.route('/:username').get(authentication, getUserWallMessages);
MessageRoute.route('/:id/direct/moderate').patch(authentication, moderateDirectMessage);

// shared messages 
MessageRoute.route('/mine').get(authentication, getMyMessages);
MessageRoute.route('/:id').get(authentication, getMessage);
MessageRoute.route('/:id').delete(authentication, deleteMessage);

module.exports = MessageRoute;