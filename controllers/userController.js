const User = require('../models/userModel');
const CustomError = require('../error');
const {StatusCodes} = require('http-status-codes');
const Board = require('../models/boardModel');
const Subscription = require('../models/subscription');

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



const getMyProfile = async(req, res) => {
  const userId = req.user.userId;

  const user = await User.findOne({ _id: userId }).select(
    'username profileImage accountType createdAt stats'
  );

  if (!user) {
    throw new CustomError.NotFoundError('User not found.');
  }

  res.status(StatusCodes.OK).json({ user });

}

const updateProfile = async (req, res) => {
  const { username, profileImage, country, accountType} = req.body;
  const userId = req.user.userId;

  if (username) {
    const taken = await User.findOne({ username, _id: { $ne: userId} });
    if (taken) {
      throw new CustomError.ConflictError('Username is already taken.');
    }
  }

  const updates = {};
  if (username) updates.username = username;
  if (profileImage) updates.profileImage = profileImage;
  if (country) updates.country = country;
  if (accountType) updates.accountType = accountType;


  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select('-password -resetPasswordToken -emailVerificationToken');

  res.status(StatusCodes.OK).json({ message: 'Profile updated.', user });
};


const getPublicProfile = async (req, res) => {
  const { username } = req.params;
  const { view } = req.query;

  const user = await User.findOne({ username }).select(
    'username profileImage accountType createdAt stats'
  );

  if (!user) {
    throw new CustomError.NotFoundError('User not found.');
  }

  let boards;

  if (view === 'tagged') {
    boards = await Board.find({
      receipent:        user._id,
      receipentFlagged: false,
      isActive:         true,
      visibility:       { $in: ['public', 'link-only'] },
    })
      .select('title description slug stats tier tags owner createdAt')
      .populate('owner', 'username profileImage')
      .sort({ createdAt: -1 });
  } else {
    boards = await Board.find({
      owner:      user._id,
      visibility: 'public',
      isActive:   true,
    })
      .select('title description slug stats tier tags createdAt')
      .sort({ createdAt: -1 });
  }

  res.status(StatusCodes.OK).json({ user, boards, view: view || 'owned' });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId

  const user = await User.findById(userId).select('+password');

  if (user.oauthProvider !== 'email' && !user.password) {
    throw new CustomError.BadRequestError('OAuth accounts cannot change password this way. Use your OAuth provider.');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new CustomError.UnauthorizedError('Current password is incorrect.');
  }

  if (currentPassword === newPassword) {
    throw new CustomError.BadRequestError('New password must be different from current password.');
  }

  user.password = newPassword;
  await user.save();

  res.status(StatusCodes.OK).json({ message: 'Password changed successfully.' });
};



const deleteAccount = async (req, res) => {
  const userId = req.user.userId;

  await Board.updateMany({ owner: userId }, { isActive: false });

  // Remove the user
  await User.findByIdAndDelete(userId);

  // Remove subscription
  await Subscription.findOneAndDelete({ user: userId });

  res.status(StatusCodes.OK).json({ message: 'Account deleted successfully.' });
};



const listUsers = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  const filter = search
    ? { $or: [{ username: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -resetPasswordToken -emailVerificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(StatusCodes.OK).json({
    users,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
};



const updateUserRole = async (req, res) => {
  const { role } = req.body;
  const allowed = ['user', 'admin'];

  // Prevent superadmin from being set via API
  if (!allowed.includes(role)) {
    throw new CustomError.BadRequestError('Invalid role. Allowed roles are: user, admin.');
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select('-password');

  if (!user) {
    throw new CustomError.NotFoundError('User not found.');
  }

  res.status(200).json({ message: 'User role updated.', user });
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
};