const express = require('express');
const UserRoute = express.Router();
const { getPublicProfile,
  checkUsername,
  getMyProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  listUsers,
  updateUserRole} = require('../controllers/userController');
const { authentication, adminAuthorization, superAdminAuthorization} = require('../middlewares/authMiddleware');

// User Routes  
UserRoute.route('/check-username/:username').get(checkUsername);
UserRoute.route('/me').get(authentication, getMyProfile);
UserRoute.route('/profile').patch(authentication, updateProfile);
UserRoute.route('/change-password').patch(authentication, changePassword); 
UserRoute.route('/delete-account').delete(authentication, deleteAccount);

// Admin Routes
UserRoute.route('/').get(authentication, adminAuthorization, listUsers);
UserRoute.route('/:id/role').patch(authentication, superAdminAuthorization, updateUserRole);

// get public profile
UserRoute.route('/profile/:username').get(authentication, getPublicProfile);


module.exports = UserRoute;