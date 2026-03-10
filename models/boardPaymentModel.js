const mongoose = require('mongoose');
const { Schema } = mongoose;
const Board = require('./boardModel');


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


async function recalcStatsForBoard(boardId) {
  try {
    const User = mongoose.model('User');
    const board = await Board.findById(boardId).select('owner').lean();
    if (board?.owner) await User.recalculateStats(board.owner);
  } catch (err) {
    console.error('Failed to recalc user stats after board payment change:', err.message);
  }
}

BoardPaymentSchema.post('save', async function (doc) {
  await recalcStatsForBoard(doc.board);
});

BoardPaymentSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  await recalcStatsForBoard(doc.board);
});

BoardPaymentSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await recalcStatsForBoard(doc.board);
});


module.exports = mongoose.model('BoardPayment', BoardPaymentSchema);