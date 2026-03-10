const mongoose = require('mongoose');
const { Schema } = mongoose;


const SponsorshipSchema = new Schema({
  
  board: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
  },
  
  sponsor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  amount:   { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  message:  { type: String, maxLength: 200, default: '' }, 
  isAnonymous: { type: Boolean, default: false },
  status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    
  },
  expiresAt:         { type: Date, default: null },
  externalPaymentId: { type: String, default: null },
}, { timestamps: true });

SponsorshipSchema.index({ board: 1, status: 1 });


// Helper to recalculate owner stats
async function recalcStatsForBoard(boardId) {
  try {
    const Board = require('./boardModel');
    const User = mongoose.model('User');
    const board = await Board.findById(boardId).select('owner').lean();
    if (board?.owner) await User.recalculateStats(board.owner);
  } catch (err) {
    console.error('Failed to recalc user stats after sponsorship change:', err.message);
  }
}

SponsorshipSchema.post('save', async function(doc) {
  await recalcStatsForBoard(doc.board);
});

SponsorshipSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  await recalcStatsForBoard(doc.board);
});

SponsorshipSchema.post('findOneAndDelete', async function(doc) {
  if (doc) await recalcStatsForBoard(doc.board);
});


module.exports = mongoose.model('Sponsorship', SponsorshipSchema);