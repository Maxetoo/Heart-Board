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
/**
 * Which of a recipient's boards are publicly listable.
 *
 * Shared by the tagged listing and the tagged count so the number on a profile
 * can never disagree with the boards behind it.
 */
const TAGGED_VISIBILITY = { $in: ['public', 'link-only'] };

/**
 * Matches boards addressed TO a user.
 *
 * `receipent` is the field createBoard actually writes. `receipentOriginal`
 * exists in the schema and was what the tagged queries filtered on, but no code
 * path has ever set it — so every "tagged" list and count came back empty.
 * Both are matched so historic boards are found today without a migration.
 */
const TAGGED_RECIPIENT_MATCH = (userId) => ({
    $or: [{ receipent: userId }, { receipentOriginal: userId }],
});

// Heart tokens are stored as boards, but they are not boards to the product and
// must never reach a board statistic: blowing one is not creating a board, and
// receiving one is not being tagged on a board.
const NOT_A_HEART = { kind: { $ne: 'heart' } };

async function computeLiveStats(userId) {
    const ownedBoards = await Board.find({ owner: userId, isActive: true, ...NOT_A_HEART })
        .select('_id')
        .lean();
    const boardIds = ownedBoards.map(b => b._id);
    const totalBoards = boardIds.length;

    const [totalMessages, totalLikes, msgSenderAgg, boardLikerAgg, profileLikesDoc, totalTagged] =
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

            // Boards this account was tagged on — i.e. is the recipient of,
            // never ones it created itself.
            //
            // This matched receipentOriginal alone, which NOTHING writes:
            // createBoard only ever sets `receipent`. Every account therefore
            // reported 0 tagged boards. Match both so existing boards count
            // now, and so the field keeps working once it is populated.
            Board.countDocuments({
                ...TAGGED_RECIPIENT_MATCH(userId),
                // Same exclusions the tagged LIST applies, or the count and the
                // list disagree for anyone who addressed a board to themselves.
                // Hearts are addressed to a person too, but being sent one is
                // not being tagged on a board — they belong to the Hearts tab
                // and to no board count.
                owner:            { $ne: userId },
                receipentFlagged: false,
                isActive:         true,
                visibility:       TAGGED_VISIBILITY,
                ...NOT_A_HEART,
            }),
        ]);

    const curatorSet = new Set([
        ...msgSenderAgg.map(r => r._id.toString()),
        ...boardLikerAgg.map(r => r._id.toString()),
    ]);

    return {
        totalBoards,
        totalMessages,
        totalLikes,
        totalTagged,
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
    const ownedBoards = await Board.find({ owner: userId, isActive: true, ...NOT_A_HEART })
        .select('_id')
        .lean();
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
    // Everything the settings drawer edits must be projected here, or the form
    // loads blank and "save" appears to do nothing because there was nothing to
    // compare against. displayName/bio/country/role/notificationPrefs were all
    // missing from this select.
    const user = await User.findById(userId).select(
        'username email displayName bio profileImage country accountType role isVerified ' +
        'oauthProvider notificationPrefs createdAt stats isEmailVerified'
    );
    if (!user) throw new CustomError.NotFoundError('User not found.');

    const liveStats = await computeLiveStats(userId);
    res.status(StatusCodes.OK).json({ user: { ...user.toObject(), stats: liveStats } });
};


const updateProfile = async (req, res) => {
    const { username, profileImage, country, accountType, bio, displayName, notificationPrefs } = req.body;
    const userId = req.user.userId;

    // `email` is deliberately not accepted. Changing it has to re-run the
    // verification flow (authController.verifyEmail), so it cannot be a silent
    // field on this endpoint — otherwise an account can be moved to an
    // unverified address while still reading as verified.
    if (req.body.email !== undefined) {
        throw new CustomError.BadRequestError(
            'Email cannot be changed here. Use the email verification flow.'
        );
    }

    // Usernames are stored lowercase and matched lowercase everywhere else
    // (checkUsername, getPublicProfile, createBoard receipent lookup), so
    // normalise here too or a mixed-case signup becomes unreachable by URL.
    const normalisedUsername = username ? username.trim().toLowerCase() : undefined;

    if (normalisedUsername) {
        const taken = await User.findOne({ username: normalisedUsername, _id: { $ne: userId } });
        if (taken) throw new CustomError.ConflictError('Username is already taken.');
    }

    // Fetch old username before updating so we can bust the public-profile cache
    const oldUser = await User.findById(userId).select('username').lean();

    const updates = {};
    if (normalisedUsername) updates.username = normalisedUsername;
    if (profileImage !== undefined) {
        // Avatars must be Cloudinary URLs. A base64 data URL here is how a
        // 3MB blob ends up inside a user document (see the same problem fixed
        // in Message.canvasData) — reject it rather than store it.
        if (typeof profileImage === 'string' && profileImage.startsWith('data:')) {
            throw new CustomError.BadRequestError(
                'Upload the image to /upload first and send the returned URL.'
            );
        }
        updates.profileImage = profileImage || '';
    }
    if (country)      updates.country      = country;
    if (bio !== undefined)         updates.bio         = bio;
    if (displayName !== undefined) updates.displayName = displayName;

    // Merge rather than replace, so a client that sends one toggle does not
    // reset the other to its schema default.
    if (notificationPrefs && typeof notificationPrefs === 'object') {
        if (typeof notificationPrefs.heartTokenAlerts === 'boolean') {
            updates['notificationPrefs.heartTokenAlerts'] = notificationPrefs.heartTokenAlerts;
        }
        if (typeof notificationPrefs.trophyCaseUpdates === 'boolean') {
            updates['notificationPrefs.trophyCaseUpdates'] = notificationPrefs.trophyCaseUpdates;
        }
    }

    if (Object.keys(updates).length === 0) {
        throw new CustomError.BadRequestError('No changes were supplied.');
    }
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
    // oldUser.username is null until the user completes account setup (and is
    // always null for a fresh Google OAuth account), so guard both keys.
    const oldUsername = oldUser?.username ? oldUser.username.toLowerCase() : null;

    await Promise.all([
        invalidate(keys.profile(userId)),
        oldUsername ? invalidate(keys.publicProfile(oldUsername)) : Promise.resolve(),
        // If the username changed, also bust the new username key
        normalisedUsername && normalisedUsername !== oldUsername
            ? invalidate(keys.publicProfile(normalisedUsername))
            : Promise.resolve(),
    ]);
 
    res.status(StatusCodes.OK).json({ message: 'Profile updated.', user });
};
 


const getPublicProfile = async (req, res) => {
    const { username }  = req.params;
    const { view, kind } = req.query;
    // Heart tokens are boards underneath but belong only on the Hearts tabs, so
    // every board list here excludes them unless ?kind=heart asks for them.
    const kindMatch = kind === 'heart' ? { kind: 'heart' } : { kind: { $ne: 'heart' } };

    // displayName / isVerified / bio are what the profile header actually
    // renders; without them the client could only show the raw username.
    // All three are already public — search returns them for every account.
    const user = await User.findOne({ username })
        .select('username displayName bio isVerified profileImage accountType createdAt stats');
    if (!user) throw new CustomError.NotFoundError(`No user found with username "@${username}".`);

    let boards;
    if (view === 'collaboration') {
        // Boards this account has left a MESSAGE on, made by somebody else —
        // the Collaboration tab. The record of a collaboration is the message,
        // so the board ids come from the Message collection; aggregate rather
        // than .distinct(), which Stable API v1 does not allow.
        const contributed = await Message.aggregate([
            {
                $match: {
                    sender:  new mongoose.Types.ObjectId(user._id.toString()),
                    context: 'board',
                    board:   { $ne: null },
                },
            },
            { $group: { _id: '$board' } },
        ]);

        boards = await Board.find({
            _id:        { $in: contributed.map((r) => r._id) },
            owner:      { $ne: user._id },
            isActive:   true,
            visibility: 'public',
            ...kindMatch,
        })
            .select('title description slug stats tier tags kind owner receipent receipentHashtag coverImage event style preview createdAt visibility')
            .populate('owner', 'username displayName profileImage')
            .populate('receipent', 'username displayName profileImage')
            .sort({ createdAt: -1 }).lean();
    } else if (view === 'tagged') {
        // Boards SOMEONE ELSE created with this account as the recipient.
        // `owner: { $ne: user._id }` keeps a board the account addressed to
        // itself out of Tagged — that one belongs under Board.
        boards = await Board.find({
            ...TAGGED_RECIPIENT_MATCH(user._id),
            owner: { $ne: user._id },
            receipentFlagged: false,
            isActive: true,
            visibility: TAGGED_VISIBILITY,
            ...kindMatch,
        })
            .select('title description slug stats tier tags kind owner receipent receipentHashtag coverImage event style preview createdAt visibility')
            .populate('owner', 'username displayName profileImage')
            .populate('receipent', 'username displayName profileImage')
            .sort({ createdAt: -1 }).lean();
    } else {
        // Only what this account has published under its own name. The filter
        // used to be absent entirely, so every board the account owned —
        // private ones included — was handed to any signed-in caller.
        //
        // 'anonymous' is excluded too: those are publicly readable but
        // deliberately unattributed, so listing them on the author's profile
        // would be the one place that names them.
        //
        // Deliberately not relaxed for the owner viewing themselves: this
        // response is cached per username with no viewer in the key (see the
        // route), so a viewer-dependent body would be served to whoever asked
        // next. The owner's full list comes from GET /board?view=owned.
        boards = await Board.find({
            owner: user._id,
            isActive: true,
            visibility: 'public',
            ...kindMatch,
        })
            .select('title description slug stats tier tags kind receipent receipentHashtag coverImage event style preview createdAt visibility')
            .populate('receipent', 'username displayName profileImage')
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

    // Deliberately a 400, not a 401. A 401 here means "your session is invalid"
    // to every generic client-side handler — the SPA's axios interceptor treats
    // any 401 as an expired cookie and clears the session, so a single typo in
    // this field signed the user out and unmounted the form mid-edit, which read
    // as the button doing nothing at all. The session is fine; the field is not.
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new CustomError.BadRequestError('Current password is incorrect.');
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
        target.username ? invalidate(keys.publicProfile(target.username.toLowerCase())) : Promise.resolve(),
        invalidate(`likedProfiles:${viewerId}`),
        // The target's own GET /user/me is cached for 5 minutes and carries
        // stats.profileLikes, so without this their heart count (and the
        // notification poller that watches it) stayed stale for a whole TTL.
        invalidate(keys.profile(targetUserId.toString())),
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