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

module.exports = mongoose.model('Sponsorship', SponsorshipSchema);