const express = require('express');
const BoardPaymentRoute = express.Router();
const {
  createBoardUpgrade,
  boardPaymentWebhook,
  getBoardPayments,
  listAllBoardPayments,
} = require('../controllers/boardPaymentController');
const { authentication, superAdminAuthorization } = require('../middlewares/authMiddleware');

// Board Payment Routes
BoardPaymentRoute.route('/:id/upgrade').post(authentication, createBoardUpgrade);
BoardPaymentRoute.route('/webhook').post(boardPaymentWebhook);
BoardPaymentRoute.route('/:id/payments').get(authentication, getBoardPayments);

// Admin route to list all board payments
BoardPaymentRoute.route('/all').get(authentication, superAdminAuthorization, listAllBoardPayments);

module.exports = BoardPaymentRoute;