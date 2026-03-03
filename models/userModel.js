const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt')



const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        minLength: 3,
        maxLength: 10,
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

    emailVerificationToken: {
        type: String
    },

    emailVerificationExpiry: {
        type: Date
    },

    resetPasswordToken: {
        type: String,
    },

    resetPasswordExpiry: {
        type: Date,
    },

    oauthId: {
        type: String,
        sparse: true 
    },

    oauthProvider: {
        type: String,
        enum: ['google', 'email'],
        default: 'google'
    },

    lastLogin: {
        type: Date,
        default: Date.now
    },

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
    
    stats: {
        totalBoards: { type: Number, default: 0 },
        totalMessages: { type: Number, default: 0 },
        totalLikes: { type: Number, default: 0 },
        totalCurators: { type: Number, default: 0 },
        totalBoardsUpgraded: { type: Number, default: 0 },
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
    const checkPassword = await bcrypt.compare(password, this.password);
    return checkPassword;
};


UserSchema.statics.findOrCreateOAuthUser = async function(profile, provider) {
    try {
        let user = await this.findOne({
            oauthId: profile.id,
            oauthProvider: provider,
        });

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
        throw new CustomError.BadRequestError(`An error occurred: ${error.message}`);
    }
};

// Recalculate aggregated stats for a user based on related collections
UserSchema.statics.recalculateStats = async function(userId) {
    const User = this;
    const Board = require('./boardModel');
    const Message = require('./message');
    const BoardLike = require('./boardLikeModel');
    const BoardPayment = require('./boardPaymentModel');
    const Sponsorship = require('./sponsporship');

    // Get boards owned by user
    const boards = await Board.find({ owner: userId }).select('_id').lean();
    const boardIds = boards.map(b => b._id);

    const totalBoards = boards.length;
    const totalMessages = boardIds.length ? await Message.countDocuments({ board: { $in: boardIds } }) : 0;
    const totalLikes = boardIds.length ? await BoardLike.countDocuments({ board: { $in: boardIds } }) : 0;

    // Unique curators: users who liked, messaged, or sponsored the owner's boards
    let curators = new Set();
    if (boardIds.length) {
        const likeUsers = await BoardLike.distinct('user', { board: { $in: boardIds } });
        likeUsers.forEach(u => curators.add(String(u)));

        const messageUsers = await Message.distinct('sender', { board: { $in: boardIds } });
        messageUsers.forEach(u => curators.add(String(u)));

        const sponsorUsers = await Sponsorship.distinct('sponsor', { board: { $in: boardIds } });
        sponsorUsers.forEach(u => curators.add(String(u)));
    }
    const totalCurators = curators.size;

    const totalBoardsUpgraded = boardIds.length ? await BoardPayment.countDocuments({ board: { $in: boardIds }, status: 'succeeded' }) : 0;

    // Update user document
    await User.findByIdAndUpdate(userId, {
        $set: {
            'stats.totalBoards': totalBoards,
            'stats.totalMessages': totalMessages,
            'stats.totalLikes': totalLikes,
            'stats.totalCurators': totalCurators,
            'stats.totalBoardsUpgraded': totalBoardsUpgraded,
        }
    });
};



module.exports = mongoose.model('User', UserSchema)