// const express = require('express');
// const UserRoute = express.Router();
// const { getPublicProfile,
//   checkUsername,
//   getMyProfile,
//   updateProfile,
//   changePassword,
//   deleteAccount,
//   listUsers,
//   updateUserRole,
//   likeProfile,
//   getLikedProfiles
// } = require('../controllers/userController');
// const { authentication, adminAuthorization, superAdminAuthorization} = require('../middlewares/authMiddleware');

// // User Routes  
// UserRoute.route('/check-username/:username').get(checkUsername);
// UserRoute.route('/me').get(authentication, getMyProfile);
// UserRoute.route('/profile').patch(authentication, updateProfile);
// UserRoute.route('/change-password').patch(authentication, changePassword); 
// UserRoute.route('/delete-account').delete(authentication, deleteAccount);

// // Admin Routes
// UserRoute.route('/').get(authentication, adminAuthorization, listUsers);
// UserRoute.route('/likes/me').get(authentication, getLikedProfiles);
// UserRoute.route('/:id/role').patch(authentication, superAdminAuthorization, updateUserRole);

// // get public profile
// UserRoute.route('/profile/:username').get(authentication, getPublicProfile);

// // Profile like toggle
// UserRoute.route('/:id/like').post(authentication, likeProfile);
 


// module.exports = UserRoute;

const express  = require('express');
const UserRoute = express.Router();

const {
  getPublicProfile,
  checkUsername,
  getMyProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  listUsers,
  updateUserRole,
  likeProfile,
  getLikedProfiles,
} = require('../controllers/userController');

const { authentication, adminAuthorization, superAdminAuthorization } = require('../middlewares/authMiddleware');
const { cache, TTL, keys } = require('../middlewares/cacheMiddleware');

// ── Check username availability (no auth, light query — short cache) ──────────
UserRoute.get(
  '/check-username/:username',
  cache(60, req => `checkUsername:${req.params.username.toLowerCase()}`),
  checkUsername
);

// ── My profile — cache per user, invalidated on update/delete ────────────────
UserRoute.get(
  '/me',
  authentication,
  cache(TTL.PROFILE, req => keys.profile(req.user.userId)),
  getMyProfile
);

// ── My liked profile IDs — cache per user, invalidated on likeProfile ─────────
UserRoute.get(
  '/likes/me',
  authentication,
  cache(TTL.PROFILE, req => `likedProfiles:${req.user.userId}`),
  getLikedProfiles
);

// ── Mutating routes (no cache — these bust caches in their controllers) ────────
UserRoute.patch('/profile',         authentication, updateProfile);
UserRoute.patch('/change-password', authentication, changePassword);
UserRoute.delete('/delete-account', authentication, deleteAccount);

// ── Admin routes ───────────────────────────────────────────────────────────────
UserRoute.get(  '/',        authentication, adminAuthorization,      listUsers);
UserRoute.patch('/:id/role',authentication, superAdminAuthorization, updateUserRole);

// ── Like a profile (mutates — no cache) ───────────────────────────────────────
UserRoute.post('/:id/like', authentication, likeProfile);

// ── Public profile — cache per username, invalidated on updateProfile ─────────
// MUST be after all fixed-segment routes (/me, /likes/me, /check-username/:x)
UserRoute.get(
  '/profile/:username',
  authentication,
  cache(TTL.PUBLIC_PROFILE, req => keys.publicProfile(req.params.username.toLowerCase())),
  getPublicProfile
);

module.exports = UserRoute;