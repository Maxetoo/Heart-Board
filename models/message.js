const mongoose = require('mongoose');
const { Schema } = mongoose;
const Board = require('./boardModel');
const User  = require('./userModel');


const MessageSchema = new Schema({

  context: {
    type: String,
    enum: ['board', 'direct'],
    required: true,
    default: 'board',
  },

  board: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    default: null,
  },

  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  type: {
    type: String,
    enum: ['text', 'audio', 'emblem'],
    required: true,
  },

  content: {
    text:       { type: String,   default: null },
    font:       { type: String,   default: null },
    color:      { type: String,   default: null },
    background: { type: String,   default: null },
    frame:      { type: String,   default: null },
    imageUrls:  [{ type: String }],
    vectorKey:  { type: String,   default: null },
    audioUrl:   { type: String,   default: null },
    duration:   { type: Number,   default: null },
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },

  isRead: {
    type: Boolean,
    default: false,
  },

}, { timestamps: true });


MessageSchema.pre('validate', function (next) {
  if (this.context === 'board' && !this.board) {
    return next(new Error('board is required for board messages.'));
  }
  if (this.context === 'direct' && !this.recipient) {
    return next(new Error('recipient is required for direct messages.'));
  }
  if (this.context === 'direct' && this.sender?.toString() === this.recipient?.toString()) {
    return next(new Error('You cannot send a direct message to yourself.'));
  }
  next();
});

MessageSchema.index({ board: 1, createdAt: -1 });                         
MessageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });          
MessageSchema.index({ recipient: 1, isRead: 1 });                          


MessageSchema.post('save', async function (doc) {
  if (doc.context !== 'board' || !doc.board) return;
  try {
    const board = await Board.findById(doc.board).select('owner').lean();
    if (board?.owner) await User.recalculateStats(board.owner);
  } catch (err) {
    console.error('Failed to recalc user stats after message save:', err.message);
  }
});

MessageSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  if (doc.context !== 'board' || !doc.board) return;
  try {
    const board = await Board.findById(doc.board).select('owner').lean();
    if (board?.owner) await User.recalculateStats(board.owner);
  } catch (err) {
    console.error('Failed to recalc user stats after message delete:', err.message);
  }
});

module.exports = mongoose.model('Message', MessageSchema);