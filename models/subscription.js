const mongoose = require('mongoose');
const { Schema } = mongoose;

const PLAN_LIMITS = {
  free:       { boardLimit: 20 },
  pro:        { boardLimit: 15},
  enterprise: { boardLimit: -1 },
};

const SubscriptionSchema = new Schema({
  
    user: {
    type: Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
    unique: true,
  },

  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },

  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active',
  },

  currentPeriodEnd: {
    type: Date,
    default: null,
  },

  externalCustomerId:     { type: String, default: null },
  externalSubscriptionId: { type: String, default: null },
}, { timestamps: true });


SubscriptionSchema.methods.getLimits = function () {
  return PLAN_LIMITS[this.plan] ?? PLAN_LIMITS.free;
};

module.exports = mongoose.model('Subscription', SubscriptionSchema);