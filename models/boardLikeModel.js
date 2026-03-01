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

module.exports = mongoose.model('BoardLike', LikeSchema);
