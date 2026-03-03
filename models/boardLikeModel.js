const mongoose = require('mongoose');
const { Schema } = mongoose;

const LikeSchema = new Schema({
  board: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

LikeSchema.index({ board: 1, user: 1 }, { unique: true });

// Update owner stats when likes are added/removed
LikeSchema.post('save', async function(doc) {
  try {
    const Board = require('./boardModel');
    const mongooseLocal = require('mongoose');
    const User = mongooseLocal.model('User');
    const board = await Board.findById(doc.board).select('owner').lean();
    if (board && board.owner) await User.recalculateStats(board.owner);
  } catch (err) {
    console.error('Failed to recalc user stats after like save:', err.message);
  }
});

LikeSchema.post('remove', async function(doc) {
  try {
    const Board = require('./boardModel');
    const mongooseLocal = require('mongoose');
    const User = mongooseLocal.model('User');
    const board = await Board.findById(doc.board).select('owner').lean();
    if (board && board.owner) await User.recalculateStats(board.owner);
  } catch (err) {
    console.error('Failed to recalc user stats after like remove:', err.message);
  }
});

module.exports = mongoose.model('BoardLike', LikeSchema);
