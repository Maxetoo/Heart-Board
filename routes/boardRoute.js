const express = require('express');
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
} = require('../controllers/boardController')
const { authentication } = require('../middlewares/authMiddleware');

// Board Routes
BoardRoute.route('/').post(authentication, createBoard);
BoardRoute.route('/').get(authentication, getMyBoards);
BoardRoute.route('/discover').get(authentication, discoverBoards);
BoardRoute.route('/:id').patch(authentication, updateBoard);
BoardRoute.route('/:id').delete(authentication, deleteBoard);
BoardRoute.route('/:slug').get(authentication, getBoardBySlug);
BoardRoute.route('/:slug/flag').patch(authentication, flagBoard);
BoardRoute.route('/:slug/unflag').patch(authentication, unflagBoard);
BoardRoute.route('/:id/like').post(authentication, likeBoard);
BoardRoute.route('/:id/share').post(authentication, shareBoard);

module.exports = BoardRoute;
