const mongoose = require('mongoose');
const { Schema } = mongoose;


const BoardPaymentSchema = new Schema({
  
    board: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
  },

  paidBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  fromTier: {
    type: String,
    enum: ['basic', 'standard'],
    required: true,
  },

  toTier: {
    type: String,
    enum: ['standard', 'premium'],
    required: true,
  },

  amount:   { type: Number, required: true }, 

  currency: { type: String, default: 'usd' },

  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending',
  },

  externalPaymentId: { type: String, default: null }, 
  
}, { timestamps: true });

module.exports = mongoose.model('BoardPayment', BoardPaymentSchema);

// Recalculate owner stats when a payment record changes (e.g., succeeded)
BoardPaymentSchema.post('save', async function(doc) {
  try {
    const Board = require('./boardModel');
    const mongooseLocal = require('mongoose');
    const User = mongooseLocal.model('User');
    const board = await Board.findById(doc.board).select('owner').lean();
    if (board && board.owner) await User.recalculateStats(board.owner);
  } catch (err) {
    console.error('Failed to recalc user stats after board payment save:', err.message);
  }
});

BoardPaymentSchema.post('remove', async function(doc) {
  try {
    const Board = require('./boardModel');
    const mongooseLocal = require('mongoose');
    const User = mongooseLocal.model('User');
    const board = await Board.findById(doc.board).select('owner').lean();
    if (board && board.owner) await User.recalculateStats(board.owner);
  } catch (err) {
    console.error('Failed to recalc user stats after board payment remove:', err.message);
  }
});