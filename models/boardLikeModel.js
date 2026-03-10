const mongoose = require('mongoose');
const { Schema } = mongoose;
const Board = require('./boardModel');


const LikeSchema = new Schema({
  board: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

LikeSchema.index({ board: 1, user: 1 }, { unique: true });


async function recalcStatsForBoard(boardId) {
  try {
    const User = mongoose.model('User');
    const board = await Board.findById(boardId).select('owner').lean();
    if (board?.owner) await User.recalculateStats(board.owner);
  } catch (err) {
    console.error('Failed to recalc user stats after like change:', err.message);
  }
}

LikeSchema.post('save', async function (doc) {
  await recalcStatsForBoard(doc.board);
});

LikeSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  await recalcStatsForBoard(doc.board);
});

LikeSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await recalcStatsForBoard(doc.board);
});


module.exports = mongoose.model('BoardLike', LikeSchema);