const express = require('express');
const AuthRoute = express.Router();
const { 
  register,
  verifyEmail,
  login,
  oauthCallback,
  logout,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const passport = require('../configs/passport');


// Auth Route 
AuthRoute.route('/register').post(register);
AuthRoute.route('/verify-email').post(verifyEmail);
AuthRoute.route('/login').post(login);
AuthRoute.route('/logout').post(logout);
AuthRoute.route('/forgot-password').post(forgotPassword);
AuthRoute.route('/reset-password').patch(resetPassword);




// OAUTH ROUTES 
AuthRoute.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    })
);
 
AuthRoute.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`,
        session: false 
    }),
    oauthCallback
);


module.exports = AuthRoute;