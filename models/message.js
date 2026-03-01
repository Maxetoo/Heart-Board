const mongoose = require('mongoose');
const { Schema } = mongoose;



const MessageSchema = new Schema({
  
    board: {
    type: Schema.Types.ObjectId,
    ref: 'Board',
    required: true,
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
    text:       { type: String, default: null },
    font:       { type: String, default: null },
    color:      { type: String, default: null },
    background: { type: String, default: null }, 
    frame:      { type: String, default: null }, 
    imageUrls:  [{ type: String }],       
    vectorKey:  { type: String, default: null }, 
    audioUrl:   { type: String, default: null },
    duration:   { type: Number, default: null }, 
  },
  
  // Board owner can moderate messages
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
}, { timestamps: true });

// Index for fast board lookups
MessageSchema.index({ board: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);