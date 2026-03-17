const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt')
const Board = require('./boardModel');
const Message = require('./message');
const BoardLike = require('./boardLikeModel');
const BoardPayment = require('./boardPaymentModel');
const Sponsorship = require('./sponsporship');


const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        minLength: [3, 'Minimum of 3 characters'],
        maxLength: [14, 'Maxiumum of 14 characters'],
        trim: true,
    }, 
    email: {
        type: String,
        required: [true, 'Please input email'],
        minLength: 5,
        validate: {
            validator: validator.isEmail,
            message: (props) => `${props.value} is not a valid email`
        },
        unique: true
    },

    password: {
        type: String,
        required: function() {
            return !this.oauthProvider;
        },
        validate: {
            validator: function (value) {
                if (!value && this.oauthProvider) return true;
                return validator.isStrongPassword(value, {
                    minLength: 5,
                    minLowercase: 1,
                    minUppercase: 1,
                    minNumbers: 1,
                    minSymbols: 1
                });
            },
            message: "Password must be at least 5 characters long and include lowercase, uppercase, number, and symbol."
        }
    },

    profileImage: {
        type: String,
        required: false,
    },
    
    role: {
        type: String,
        enum: ['user', 'admin', 'super_admin'],
        default: 'user'
    },

    country: {
        type: String,
        required: false,
    },

    isEmailVerified: {
        type: Boolean,
        default: false
    },

    emailVerificationToken: { type: String },
    emailVerificationExpiry: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },

    oauthId: {
        type: String,
        sparse: true 
    },

    oauthProvider: {
        type: String,
        enum: ['google', 'email'],
        default: 'google'
    },

    lastLogin: { type: Date, default: Date.now },

    lastLoginMethod: {
        type: String,
        enum: ['email', 'oauth'],
        default: 'email'
    },

    accountType: {
        type: String,
        enum: ['personal', 'enterprise'],
        default: 'personal'
    },

    // Profiles this user has liked (tracks who the viewer liked, not who liked them)
    likedProfiles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    
    stats: {
        // These 4 are computed live in the controller — never written by recalculateStats
        // They are kept here only as a cache; source of truth is always the live query
        totalBoards:         { type: Number, default: 0 },
        totalMessages:       { type: Number, default: 0 },
        totalLikes:          { type: Number, default: 0 },
        totalCurators:       { type: Number, default: 0 },
        totalBoardsUpgraded: { type: Number, default: 0 },
        // profileLikes is maintained exclusively via $inc in likeProfile controller
        // and is NEVER touched by recalculateStats so it can't be accidentally zeroed
        profileLikes:        { type: Number, default: 0 },
    }
}, {
    timestamps: true
})

UserSchema.pre('save', async function() {
    if (!this.isModified('password') || (!this.password && this.oauthProvider)) return;
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function(password) {
    if (this.oauthProvider && !this.password) {
        throw new Error('Invalid login method. Please use your OAuth provider to log in.');
    }
    return bcrypt.compare(password, this.password);
};


UserSchema.statics.findOrCreateOAuthUser = async function(profile, provider) {
    try {
        let user = await this.findOne({ oauthId: profile.id, oauthProvider: provider });

        if (user) {
            user.lastLoginMethod = 'oauth';
            user.lastLogin = new Date();
            await user.save();
            return user;
        }

        const email = profile.emails?.[0]?.value;
        if (email) {
            user = await this.findOne({ email });
            if (user) {
                user.oauthProvider = provider;
                user.oauthId = profile.id;
                user.lastLoginMethod = 'oauth';
                user.lastLogin = new Date();
                await user.save();
                return user;
            }
        }

        const newUser = new this({
            email,
            oauthProvider: provider,
            oauthId: profile.id,
            isEmailVerified: true,
            lastLoginMethod: 'oauth',
            lastLogin: new Date(),
        });
        await newUser.save();
        return newUser;

    } catch (error) {
        throw new Error(`OAuth error: ${error.message}`);
    }
};


/**
 * recalculateStats — called from mongoose hooks (board/message/boardLike post-save/delete).
 * Computes totalBoards, totalMessages, totalLikes, totalCurators, totalBoardsUpgraded.
 *
 * IMPORTANT: profileLikes is intentionally excluded — it is maintained by the
 * likeProfile controller via atomic $inc and must never be overwritten here.
 */
UserSchema.statics.recalculateStats = async function(userId) {
    const User = this;

    // Only count active boards
    const boards = await Board.find({ owner: userId, isActive: true }).select('_id').lean();
    const boardIds = boards.map(b => b._id);

    const totalBoards = boards.length;

    const totalMessages = boardIds.length
        ? await Message.countDocuments({ board: { $in: boardIds }, context: 'board' })
        : 0;

    // Sum likes from BoardLike collection (source of truth for likes)
    const totalLikes = boardIds.length
        ? await BoardLike.countDocuments({ board: { $in: boardIds } })
        : 0;

    // Unique curators: users who sent messages OR liked OR sponsored any board (excl. owner).
    // NOTE: .distinct() is banned in MongoDB API Version 1 (apiStrict).
    // Use aggregate + $group to get unique IDs instead.
    let curators = new Set();
    if (boardIds.length) {
        const [likeAgg, msgAgg, sponsorAgg] = await Promise.all([
            BoardLike.aggregate([
                { $match: { board: { $in: boardIds } } },
                { $group: { _id: '$user' } },
            ]),
            Message.aggregate([
                { $match: { board: { $in: boardIds }, context: 'board' } },
                { $group: { _id: '$sender' } },
            ]),
            Sponsorship.aggregate([
                { $match: { board: { $in: boardIds } } },
                { $group: { _id: '$sponsor' } },
            ]),
        ]);
        [...likeAgg, ...msgAgg, ...sponsorAgg].forEach(r => {
            if (r._id.toString() !== userId.toString()) curators.add(r._id.toString());
        });
    }
    const totalCurators = curators.size;

    const totalBoardsUpgraded = boardIds.length
        ? await BoardPayment.countDocuments({ board: { $in: boardIds }, status: 'succeeded' })
        : 0;

    // Use $set only on these fields — profileLikes is deliberately omitted
    await User.findByIdAndUpdate(userId, {
        $set: {
            'stats.totalBoards':         totalBoards,
            'stats.totalMessages':       totalMessages,
            'stats.totalLikes':          totalLikes,
            'stats.totalCurators':       totalCurators,
            'stats.totalBoardsUpgraded': totalBoardsUpgraded,
        }
    });
};


module.exports = mongoose.model('User', UserSchema)