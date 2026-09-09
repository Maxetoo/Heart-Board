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
  /**
   * The primary reaction, kept as the first entry of `reactions`.
   *
   * Retained so documents written before multi-reaction support, and anything
   * still reading a single value (Board.lastReaction), keep working.
   */
  reaction: {
    type: String,
    enum: ['clap', 'heart', 'thumbs', 'smile', 'sad', 'fire'],
    default: null,
  },

  /**
   * Every reaction this user has put on this board.
   *
   * The board view has always let one person pick several (clap AND fire), but
   * there was nowhere to store more than one — and nothing ever called the
   * reaction endpoint at all, so a reaction lived only in React state and was
   * gone on refresh.
   */
  reactions: {
    type:    [{ type: String, enum: ['clap', 'heart', 'thumbs', 'smile', 'sad', 'fire'] }],
    default: [],
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