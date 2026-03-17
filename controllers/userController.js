const mongoose = require('mongoose');
const User = require('../models/userModel');
const Board = require('../models/boardModel');
const Message = require('../models/message');
const BoardLike = require('../models/boardLikeModel');
const Sponsorship = require('../models/sponsporship');
const CustomError = require('../error');
const { StatusCodes } = require('http-status-codes');
const Subscription = require('../models/subscription');
const { invalidate, invalidatePattern, keys } = require('../middlewares/cacheMiddleware');


// ─── Helpers 
async function computeLiveStats(userId) {
    const ownedBoards = await Board.find({ owner: userId, isActive: true })
        .select('_id')
        .lean();
    const boardIds = ownedBoards.map(b => b._id);
    const totalBoards = boardIds.length;

    const [totalMessages, totalLikes, msgSenderAgg, boardLikerAgg, profileLikesDoc] =
        await Promise.all([
            boardIds.length
                ? Message.countDocuments({ board: { $in: boardIds }, context: 'board' })
                : Promise.resolve(0),
            boardIds.length
                ? BoardLike.countDocuments({ board: { $in: boardIds } })
                : Promise.resolve(0),
            // aggregate instead of distinct (apiStrict compatible)
            boardIds.length
                ? Message.aggregate([
                      { $match: { board: { $in: boardIds }, context: 'board', sender: { $ne: userId } } },
                      { $group: { _id: '$sender' } },
                  ])
                : Promise.resolve([]),
            boardIds.length
                ? BoardLike.aggregate([
                      { $match: { board: { $in: boardIds }, user: { $ne: userId } } },
                      { $group: { _id: '$user' } },
                  ])
                : Promise.resolve([]),
            User.findById(userId).select('stats.profileLikes').lean(),
        ]);

    const curatorSet = new Set([
        ...msgSenderAgg.map(r => r._id.toString()),
        ...boardLikerAgg.map(r => r._id.toString()),
    ]);

    return {
        totalBoards,
        totalMessages,
        totalLikes,
        totalCurators: curatorSet.size,
        profileLikes:  profileLikesDoc?.stats?.profileLikes ?? 0,
    };
}

async function getMostLikedBoard(userId) {
    return Board.findOne({
        owner: userId, isActive: true, visibility: { $ne: 'private' },
        'stats.likes': { $gt: 0 },
    }).sort({ 'stats.likes': -1 }).select('title slug stats visibility coverImage').lean();
}

async function getMostActiveBoard(userId) {
    return Board.findOne({
        owner: userId, isActive: true, visibility: { $ne: 'private' },
        'stats.messages': { $gt: 0 },
    }).sort({ 'stats.messages': -1 }).select('title slug stats visibility coverImage').lean();
}

async function getTopCurator(userId) {
    const uid = new mongoose.Types.ObjectId(userId.toString());
    const ownedBoards = await Board.find({ owner: userId, isActive: true }).select('_id').lean();
    const boardIds = ownedBoards.map(b => b._id);
    if (!boardIds.length) return null;

    const [result] = await Message.aggregate([
        { $match: { board: { $in: boardIds }, context: 'board', sender: { $ne: uid } } },
        { $group: { _id: '$sender', messageCount: { $sum: 1 } } },
        { $sort:  { messageCount: -1 } },
        { $limit: 1 },
    ]);
    if (!result) return null;

    const curator = await User.findById(result._id).select('username profileImage').lean();
    return curator ? { ...curator, messageCount: result.messageCount } : null;
}


const checkUsername = async (req, res) => {
    const { username } = req.params;
    if (!username || username.trim().length < 3) {
        return res.status(StatusCodes.OK).json({ available: false, message: 'Username must be at least 3 characters.' });
    }
    const taken = await User.findOne({ username: username.trim().toLowerCase() });
    res.status(StatusCodes.OK).json({
        available: !taken,
        message: taken ? 'Username is already taken.' : 'Username is available.',
    });
};


const getMyProfile = async (req, res) => {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('username email profileImage accountType createdAt stats isEmailVerified');
    if (!user) throw new CustomError.NotFoundError('User not found.');

    const liveStats = await computeLiveStats(userId);
    res.status(StatusCodes.OK).json({ user: { ...user.toObject(), stats: liveStats } });
};


const updateProfile = async (req, res) => {
    const { username, profileImage, country, accountType } = req.body;
    const userId = req.user.userId;
 
    if (username) {
        const taken = await User.findOne({ username, _id: { $ne: userId } });
        if (taken) throw new CustomError.ConflictError('Username is already taken.');
    }
 
    // Fetch old username before updating so we can bust the public-profile cache
    const oldUser = await User.findById(userId).select('username').lean();
 
    const updates = {};
    if (username)     updates.username     = username;
    if (profileImage) updates.profileImage = profileImage;
    if (country)      updates.country      = country;
    // Only allow 'personal' from the client. 'enterprise' is set exclusively
    // by the subscription webhook after a confirmed payment.
    // if (accountType === 'personal') updates.accountType = 'personal';
    // if (accountType === 'pro') {
    //     throw new CustomError.BadRequestError('Payment required')
    // }
 
    const user = await User.findByIdAndUpdate(userId, updates, {
        new: true, runValidators: true,
    }).select('-password -resetPasswordToken -emailVerificationToken');
 
    // ── Cache invalidation 
    await Promise.all([
        invalidate(keys.profile(userId)),
        invalidate(keys.publicProfile(oldUser.username.toLowerCase())),
        // If username changed, also bust the new username key
        username && username.toLowerCase() !== oldUser.username.toLowerCase()
            ? invalidate(keys.publicProfile(username.toLowerCase()))
            : Promise.resolve(),
    ]);
 
    res.status(StatusCodes.OK).json({ message: 'Profile updated.', user });
};
 


const getPublicProfile = async (req, res) => {
    const { username } = req.params;
    const { view }     = req.query;

    const user = await User.findOne({ username }).select('username profileImage accountType createdAt stats');
    if (!user) throw new CustomError.NotFoundError(`No user found with username "@${username}".`);

    let boards;
    if (view === 'tagged') {
        boards = await Board.find({
            receipentOriginal: user._id, receipentFlagged: false, isActive: true,
            visibility: { $in: ['public', 'link-only'] },
        })
            .select('title description slug stats tier tags owner createdAt visibility')
            .populate('owner', 'username profileImage')
            .sort({ createdAt: -1 }).lean();
    } else {
        boards = await Board.find({ owner: user._id, isActive: true })
            .select('title description slug stats tier tags createdAt visibility')
            .sort({ createdAt: -1 }).lean();
    }

    const [liveStats, mostLikedBoard, activeBoard, topCurator] = await Promise.all([
        computeLiveStats(user._id),
        getMostLikedBoard(user._id),
        getMostActiveBoard(user._id),
        getTopCurator(user._id),
    ]);

    res.status(StatusCodes.OK).json({
        user:    { ...user.toObject(), stats: liveStats },
        boards,
        view:    view || 'owned',
        summary: { mostLikedBoard, activeBoard, topCurator },
    });
};


const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId).select('+password');
    if (!user) throw new CustomError.NotFoundError('User not found.');

    if (user.oauthProvider !== 'email' && !user.password) {
        throw new CustomError.BadRequestError('OAuth accounts cannot change password this way. Use your OAuth provider.');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new CustomError.UnauthorizedError('Current password is incorrect.');
    if (currentPassword === newPassword) throw new CustomError.BadRequestError('New password must be different.');

    user.password = newPassword;
    await user.save();

    res.status(StatusCodes.OK).json({ message: 'Password changed successfully.' });
};


const deleteAccount = async (req, res) => {
    const userId = req.user.userId;
    const user   = await User.findById(userId).select('username').lean();

    await Board.updateMany({ owner: userId }, { isActive: false });
    await User.findByIdAndDelete(userId);
    await Subscription.findOneAndDelete({ user: userId });

    
    await Promise.all([
        invalidate(keys.profile(userId)),
        user?.username ? invalidate(keys.publicProfile(user.username.toLowerCase())) : Promise.resolve(),
        invalidatePattern(`myBoards:${userId}:*`),
        invalidatePattern(`myMsgs:${userId}:*`),
        invalidate(`likedProfiles:${userId}`),
    ]);

    res.status(StatusCodes.OK).json({ message: 'Account deleted successfully.' });
};


const listUsers = async (req, res) => {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const skip   = (page - 1) * limit;
    const search = req.query.search || '';
    const filter = search
        ? { $or: [{ username: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
        : {};

    const [users, total] = await Promise.all([
        User.find(filter).select('-password -resetPasswordToken -emailVerificationToken')
            .sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter),
    ]);

    res.status(StatusCodes.OK).json({ users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
};


const updateUserRole = async (req, res) => {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) throw new CustomError.BadRequestError('Invalid role.');
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) throw new CustomError.NotFoundError('User not found.');
    res.status(200).json({ message: 'User role updated.', user });
};


const likeProfile = async (req, res) => {
    const viewerId     = req.user.userId;
    const targetUserId = req.params.id;

    if (viewerId.toString() === targetUserId.toString()) {
        throw new CustomError.BadRequestError('You cannot like your own profile.');
    }

    const target = await User.findById(targetUserId).select('_id username');
    if (!target) throw new CustomError.NotFoundError('User not found.');

    const viewer = await User.findById(viewerId).select('likedProfiles');
    if (!viewer)  throw new CustomError.NotFoundError('Viewer user not found.');

    const alreadyLiked = (viewer.likedProfiles ?? [])
        .map(id => id.toString()).includes(targetUserId.toString());

    if (alreadyLiked) {
        await Promise.all([
            User.findByIdAndUpdate(viewerId,     { $pull:     { likedProfiles: targetUserId } }),
            User.findByIdAndUpdate(targetUserId, { $inc:      { 'stats.profileLikes': -1 } }),
        ]);
    } else {
        await Promise.all([
            User.findByIdAndUpdate(viewerId,     { $addToSet: { likedProfiles: targetUserId } }),
            User.findByIdAndUpdate(targetUserId, { $inc:      { 'stats.profileLikes': 1 } }),
        ]);
    }

    const updated   = await User.findById(targetUserId).select('stats.profileLikes');
    const likeCount = Math.max(0, updated?.stats?.profileLikes ?? 0);

    await Promise.all([
        invalidate(keys.publicProfile(target.username.toLowerCase())),
        invalidate(`likedProfiles:${viewerId}`),
    ]);

    res.status(StatusCodes.OK).json({
        liked: !alreadyLiked, likeCount,
        message: alreadyLiked ? 'Profile unliked.' : 'Profile liked.',
    });
};


const getLikedProfiles = async (req, res) => {
    const userId = req.user.userId;
    const user   = await User.findById(userId).select('likedProfiles');
    res.status(StatusCodes.OK).json({
        likedProfileIds: (user?.likedProfiles ?? []).map(id => id.toString()),
    });
};


module.exports = {
    checkUsername,
    getMyProfile,
    getPublicProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    listUsers,
    updateUserRole,
    likeProfile,
    getLikedProfiles,
};