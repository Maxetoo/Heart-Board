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
//
// The key has to account for ?view: the handler returns a different board list
// for it (boards the account owns by default, boards it was tagged on for
// view=tagged). Keyed on the username alone, those two responses shared one
// entry, so whichever was requested first was served to the other for the whole
// TTL — a profile showing the wrong set of boards.
//
// Only the non-default view is suffixed, deliberately: the plain key stays
// exactly what every invalidate(keys.publicProfile(username)) call across the
// controllers already deletes. The trade is that a ?view=tagged entry is not
// invalidated on write and can be up to TTL stale; switch those calls to
// invalidatePattern(`${key}*`) if that view ever ships.
UserRoute.get(
  '/profile/:username',
  authentication,
  cache(TTL.PUBLIC_PROFILE, req => {
    const base = keys.publicProfile(req.params.username.toLowerCase());
    // `kind` selects between boards and heart tokens and so is part of the
    // identity of the response — leaving it out of the key served one as the
    // other for the rest of the TTL.
    const suffix = [req.query.view, req.query.kind].filter(Boolean).join(':');
    return suffix ? `${base}:${suffix}` : base;
  }),
  getPublicProfile
);

module.exports = UserRoute;