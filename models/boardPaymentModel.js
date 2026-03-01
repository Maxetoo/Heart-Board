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