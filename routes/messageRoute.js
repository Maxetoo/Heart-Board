const express = require('express');
const MessageRoute = express.Router();
const {postMessage,
  getBoardMessages,
  getMessage,
  deleteMessage,
  moderateMessage,
  getMyMessages} = require('../controllers/messageController')
const { authentication } = require('../middlewares/authMiddleware');

// Message Routes 
MessageRoute.route('/:slug').post(authentication, postMessage);
MessageRoute.route('/mine').get(authentication, getMyMessages);
MessageRoute.route('/:id').get(authentication, getMessage);
MessageRoute.route('/:id').delete(authentication, deleteMessage);
MessageRoute.route('/:id/status').patch(authentication, moderateMessage);

module.exports = MessageRoute;