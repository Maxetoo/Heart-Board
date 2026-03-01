const mongoose = require('mongoose');
const { Schema } = mongoose;
const { nanoid } = require('nanoid');


const BOARD_TIER_LIMITS = {
  basic:    10,
  standard: 50,
  premium:  -1,
};


const BoardSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  receipent: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  title: {
    type: String,
    required: [true, 'Board title is required.'],
    trim: true,
    maxLength: 80,
  },

  description: {
    type: String,
    maxLength: 300,
    default: '',
  },

  slug: {
    type: String,
    unique: true,
    default: () => nanoid(10),
  },

  visibility: {
    type: String,
    enum: ['public', 'private', 'link-only'],
    default: 'private',
  },

  tier: {
    type: String,
    enum: ['basic', 'standard', 'premium'],
    default: 'basic',
  },

  tags: {
    type: [String],
    default: [],
  },

  stats: {
    likes:    { type: Number, default: 0 },
    shares:   { type: Number, default: 0 },
    visits:   { type: Number, default: 0 },
    messages: { type: Number, default: 0 }, 
  },

  isActive: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true });


// Resolve how many messages this board can hold based on its tier
BoardSchema.methods.getMessageLimit = function () {
  return BOARD_TIER_LIMITS[this.tier] ?? BOARD_TIER_LIMITS.basic;
};


BoardSchema.methods.canAcceptMessage = function () {
  const limit = this.getMessageLimit();
  return limit === -1 || this.stats.messages < limit;
};

module.exports = mongoose.model('Board', BoardSchema);