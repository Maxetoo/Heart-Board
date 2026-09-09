const express = require('express');
const AuthRoute = express.Router();
const { 
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  oauthCallback,
  logout,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} = require('../controllers/authController');
const passport = require('../configs/passport');
const { appUrl } = require('../configs/origins');


// Auth Route 
AuthRoute.route('/register').post(register);
AuthRoute.route('/verify-email').post(verifyEmail);
AuthRoute.route('/resend-verification-email').post(resendVerificationEmail);
AuthRoute.route('/login').post(login);
AuthRoute.route('/logout').post(logout);
AuthRoute.route('/forgot-password').post(forgotPassword);
// GET checks the link is still live so the page can show the password fields
// only when they lead somewhere; PATCH performs the reset.
AuthRoute.route('/reset-password').get(verifyResetToken).patch(resetPassword);




// OAUTH ROUTES 
AuthRoute.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    })
);
 
AuthRoute.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: appUrl('/login?error=oauth_failed'),
        session: false 
    }),
    oauthCallback
);


module.exports = AuthRoute;