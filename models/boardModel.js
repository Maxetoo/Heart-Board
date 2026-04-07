// const mongoose = require('mongoose');
// const User = require('./userModel');
// const { Schema } = mongoose;
// const { nanoid } = require('nanoid');

// const BOARD_TIER_LIMITS = {
//   basic:    20,
//   standard: 50,
//   premium:  -1,
// };

// const BoardSchema = new Schema({
//   owner: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },

//   receipent: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     default: null,
//   },

//   receipentFlagged: {
//     type: Boolean,
//     default: false,
//   },

//   receipentFlagReason: {
//     type: String,
//     default: null,
//   },

//   title: {
//     type: String,
//     required: [true, 'Board title is required.'],
//     trim: true,
//     maxLength: 80,
//   },

//   description: {
//     type: String,
//     maxLength: 300,
//     default: '',
//   },

//   slug: {
//     type: String,
//     unique: true,
//     default: () => nanoid(10),
//   },

//   coverImage: {
//     type: String,
//     default: null,
//   },

//   event: {
//     type: String,
//     enum: ['birthday', 'wedding', 'anniversary', 'graduation', 'sport', 'retirement', 'promotion', 'other'],
//     default: null,
//   },

//   visibility: {
//     type: String,
//     enum: ['public', 'private', 'anonymous'],
//     default: 'public',
//   },

//   tier: {
//     type: String,
//     enum: ['basic', 'standard', 'premium'],
//     default: 'basic',
//   },

//   tags: {
//     type: [String],
//     default: [],
//   },

//   stats: {
//     likes:    { type: Number, default: 0 },
//     shares:   { type: Number, default: 0 },
//     visits:   { type: Number, default: 0 },
//     messages: { type: Number, default: 0 },
//   },

//   isActive: {
//     type: Boolean,
//     default: true,
//   },

// }, { timestamps: true });

// BoardSchema.methods.getMessageLimit = function () {
//   return BOARD_TIER_LIMITS[this.tier] ?? BOARD_TIER_LIMITS.basic;
// };

// BoardSchema.methods.canAcceptMessage = function () {
//   const limit = this.getMessageLimit();
//   return limit === -1 || this.stats.messages < limit;
// };


// // Helper to recalculate owner stats
// async function recalcStatsForOwner(ownerId) {
//   try {
//     await User.recalculateStats(ownerId);
//   } catch (err) {
//     console.error('Failed to recalc user stats after board change:', err.message);
//   }
// }

// // Fires when doc.save() is called
// BoardSchema.post('save', async function (doc) {
//   await recalcStatsForOwner(doc.owner);
// });

// // Fires when doc.deleteOne() is called on a document instance
// BoardSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
//   await recalcStatsForOwner(doc.owner);
// });

// // Fires when Board.findOneAndDelete() is called
// BoardSchema.post('findOneAndDelete', async function (doc) {
//   if (doc) await recalcStatsForOwner(doc.owner);
// });


// module.exports = mongoose.model('Board', BoardSchema);


// const mongoose = require('mongoose');
// const User = require('./userModel');
// const { Schema } = mongoose;
// const { nanoid } = require('nanoid');

// const BOARD_TIER_LIMITS = {
//   basic:    20,
//   standard: 50,
//   premium:  -1,
// };

// const BoardSchema = new Schema({
//   owner: {
//     type:     Schema.Types.ObjectId,
//     ref:      'User',
//     required: true,
//   },

//   receipent: {
//     type:    Schema.Types.ObjectId,
//     ref:     'User',
//     default: null,
//   },

//   receipentFlagged: {
//     type:    Boolean,
//     default: false,
//   },

//   receipentFlagReason: {
//     type:    String,
//     default: null,
//   },

//   receipentOriginal: {
//     type:    Schema.Types.ObjectId,
//     ref:     'User',
//     default: null,
//   },

//   title: {
//     type:      String,
//     required:  [true, 'Board title is required.'],
//     trim:      true,
//     maxLength: 80,
//   },

//   description: {
//     type:      String,
//     maxLength: 300,
//     default:   '',
//   },

//   slug: {
//     type:    String,
//     unique:  true,
//     default: () => nanoid(10),
//   },

//   coverImage: {
//     type:    String,
//     default: null,
//   },

//   event: {
//     type:    String,
//     enum:    ['birthday', 'wedding', 'anniversary', 'graduation', 'sport', 'retirement', 'promotion', 'other'],
//     default: null,
//   },

//   visibility: {
//     type:    String,
//     enum:    ['public', 'private', 'anonymous'],
//     default: 'public',
//   },

//   tier: {
//     type:    String,
//     enum:    ['basic', 'standard', 'premium'],
//     default: 'basic',
//   },

//   tags: {
//     type:    [String],
//     default: [],
//   },

//   stats: {
//     likes:    { type: Number, default: 0 },
//     shares:   { type: Number, default: 0 },
//     visits:   { type: Number, default: 0 },
//     messages: { type: Number, default: 0 },
//   },

//   isActive: {
//     type:    Boolean,
//     default: true,
//   },

// }, { timestamps: true });

// BoardSchema.methods.getMessageLimit = function () {
//   return BOARD_TIER_LIMITS[this.tier] ?? BOARD_TIER_LIMITS.basic;
// };

// BoardSchema.methods.canAcceptMessage = function () {
//   const limit = this.getMessageLimit();
//   return limit === -1 || this.stats.messages < limit;
// };

// async function recalcStatsForOwner(ownerId) {
//   try {
//     await User.recalculateStats(ownerId);
//   } catch (err) {
//     console.error('Failed to recalc user stats after board change:', err.message);
//   }
// }

// BoardSchema.post('save', async function (doc) {
//   await recalcStatsForOwner(doc.owner);
// });

// BoardSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
//   await recalcStatsForOwner(doc.owner);
// });

// BoardSchema.post('findOneAndDelete', async function (doc) {
//   if (doc) await recalcStatsForOwner(doc.owner);
// });


// module.exports = mongoose.model('Board', BoardSchema);


const mongoose = require('mongoose');
const User = require('./userModel');
const { Schema } = mongoose;
const { nanoid } = require('nanoid');


const BOARD_TIER_LIMITS = {
  basic:    20,
  standard: 50,
  premium:  -1,
};

const BoardSchema = new Schema({
  owner: {
    type:     Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  receipent: {
    type:    Schema.Types.ObjectId,
    ref:     'User',
    default: null,
  },

  receipentOriginal: {
    type:    Schema.Types.ObjectId,
    ref:     'User',
    default: null,
  },

  receipentHashtag: {
    type:    String,
    default: null,
    trim:    true,
    lowercase: true,
  },

  receipentFlagged: {
    type:    Boolean,
    default: false,
  },

  receiprentFlagReason: {
    type:    String,
    default: null,
  },

  title: {
    type:      String,
    required:  [true, 'Board title is required.'],
    trim:      true,
    maxLength: 80,
  },

  description: {
    type:      String,
    maxLength: 300,
    default:   '',
  },

  slug: {
    type:    String,
    unique:  true,
    default: () => nanoid(10),
  },

  coverImage: {
    type:    String,
    default: null,
  },

  event: {
    type:    String,
    enum:    ['birthday', 'wedding', 'anniversary', 'graduation', 'sport', 'retirement', 'promotion', 'other'],
    default: null,
  },

  visibility: {
    type:    String,
    enum:    ['public', 'private', 'anonymous'],
    default: 'public',
  },

  tier: {
    type:    String,
    enum:    ['basic', 'standard', 'premium'],
    default: 'basic',
  },

  tags: {
    type:    [String],
    default: [],
  },

  stats: {
    likes:    { type: Number, default: 0 },
    shares:   { type: Number, default: 0 },
    visits:   { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
  },

  isActive: {
    type:    Boolean,
    default: true,
  },

  onlyMe: {
    type:    Boolean,
    default: false,
  },

}, { timestamps: true });

BoardSchema.methods.getMessageLimit = function () {
  return BOARD_TIER_LIMITS[this.tier] ?? BOARD_TIER_LIMITS.basic;
};

BoardSchema.methods.canAcceptMessage = function () {
  const limit = this.getMessageLimit();
  return limit === -1 || this.stats.messages < limit;
};

async function recalcStatsForOwner(ownerId) {
  try {
    await User.recalculateStats(ownerId);
  } catch (err) {
    console.error('Failed to recalc user stats after board change:', err.message);
  }
}

BoardSchema.post('save', async function (doc) {
  await recalcStatsForOwner(doc.owner);
});

BoardSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  await recalcStatsForOwner(doc.owner);
});

BoardSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await recalcStatsForOwner(doc.owner);
});

module.exports = mongoose.model('Board', BoardSchema);