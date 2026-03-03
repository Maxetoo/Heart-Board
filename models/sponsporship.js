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

// Recalculate owner stats when sponsorships are created/removed
SponsorshipSchema.post('save', async function(doc) {
  try {
    const Board = require('./boardModel');
    const mongooseLocal = require('mongoose');
    const User = mongooseLocal.model('User');
    const board = await Board.findById(doc.board).select('owner').lean();
    if (board && board.owner) await User.recalculateStats(board.owner);
  } catch (err) {
    console.error('Failed to recalc user stats after sponsorship save:', err.message);
  }
});

SponsorshipSchema.post('remove', async function(doc) {
  try {
    const Board = require('./boardModel');
    const mongooseLocal = require('mongoose');
    const User = mongooseLocal.model('User');
    const board = await Board.findById(doc.board).select('owner').lean();
    if (board && board.owner) await User.recalculateStats(board.owner);
  } catch (err) {
    console.error('Failed to recalc user stats after sponsorship remove:', err.message);
  }
});

module.exports = mongoose.model('Sponsorship', SponsorshipSchema);