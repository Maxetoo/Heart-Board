const mongoose = require('mongoose');
const User = require('./userModel');
const { Schema } = mongoose;
const { nanoid } = require('nanoid');


const BOARD_TIER_LIMITS = {
  basic:    30,
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

  /**
   * What this board IS: an ordinary message board, or a heart token blown at
   * somebody.
   *
   * A heart token used to be a client-side object with an invented id that was
   * pushed into the local feed and never sent anywhere, so it vanished on
   * reload and never reached the recipient. Persisting it as a board with
   * `kind: 'heart'` — the chosen heart lives in style.hearts, the recipient in
   * receipent — gives it an owner, a recipient and an address, which is all the
   * Hearts tab on either profile needs.
   */
  kind: {
    type:    String,
    enum:    ['board', 'heart'],
    default: 'board',
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

  /**
   * Denormalised snapshot of the board's face message, so feed cards can render
   * the actual artwork without a second request.
   *
   * A Board carries no artwork of its own — it lives on the board's messages —
   * and the list endpoints only project board fields. Feed cards were therefore
   * text-only until the user opened a board and its messages were fetched.
   *
   * Kept deliberately small: canvasData here has inline data: URLs stripped, so
   * a legacy 3MB message never ends up multiplied across a page of 12 cards.
   * The full artwork is still served by GET /message/:slug/board.
   */
  preview: {
    text:       { type: String, default: null },
    imageUrl:   { type: String, default: null },
    audioUrl:   { type: String, default: null },
    type:       { type: String, default: null },
    canvasData: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedAt:  { type: Date,   default: null },
  },

  // Presentation chosen in the create flow: frame theme, sticker and confetti.
  // Free-form strings on purpose — these are asset keys owned by the frontend,
  // so new frames can ship without a schema migration.
  style: {
    theme:    { type: String, default: null },
    sticker:  { type: String, default: null },
    confetti: { type: String, default: null },
    // Semantic Heart Spectrum ids picked in the composer. The composer has
    // always collected these; there was nowhere to put them, so every board
    // lost its hearts on reload.
    hearts:   { type: [String], default: [] },
  },

  stats: {
    likes:    { type: Number, default: 0 },
    shares:   { type: Number, default: 0 },
    visits:   { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
  },

  lastReaction: {
    type:    String,
    enum:    ['clap', 'heart', 'thumbs', 'smile', 'sad', 'fire', null],
    default: null,
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