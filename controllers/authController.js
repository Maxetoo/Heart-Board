const User = require('../models/userModel');
const CustomError = require('../error');
const {StatusCodes} = require('http-status-codes');
const Subscription = require('../models/subscription');
const {createCookies} = require('../helpers/jwtHelper')
const crypto = require('crypto');
const emailSendingQueue = require('../events/emailSendingEvent');  



const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError('Email and Password are required.');
  }

  const existing = await User.findOne({ email });

  if (existing) {
    throw new CustomError.BadRequestError('Email already in use.');
  }

  // generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); 

  const user = await User.create({
    email,
    password,
    oauthProvider: 'email',
    emailVerificationToken: verificationToken,
    emailVerificationExpiry: verificationExpiry,
  });


  // Create a free subscription for the new user
  await Subscription.create({ user: user._id });

  
    const token = {
        userId: user._id,
        role: user.role,
    };

  createCookies(res, token);

  // send verification email
  const protocol = req.protocol; 
  const host = req.get('host'); 

  const verification_url = `${protocol}://${host}/verify-email?verificationToken=${verificationToken}`;

  const emailDetails = {
      email, 
      verification_url
  }
    
  await emailSendingQueue.add('send-verification-email', { 
      funcName: 'resendVerificationEmail',
      args: [emailDetails]
  });

  res.status(StatusCodes.CREATED).json({
    message: 'Registration successful. Please check your email to verify your account.',
  });
};


const verifyEmail = async (req, res) => {
  const { verificationToken } = req.query;

  const user = await User.findOne({
    emailVerificationToken: verificationToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!verificationToken || !user) {
    throw new CustomError.BadRequestError('Invalid or expired verification token.');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save();

  res.status(StatusCodes.OK).json({ message: 'Email verified successfully. You can now log in.' });
};


const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError.BadRequestError('Email is required.');
  }
  
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.NotFoundError('If that email exists, a verification email has been sent.');
  }

  if (user.isEmailVerified) {
    throw new CustomError.BadRequestError('Email is already verified. Please log in.');
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000);

  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpiry = verificationExpiry;
  await user.save();

  // send verification email
  const protocol = req.protocol; 
  const host = req.get('host'); 

  const verification_url = `${protocol}://${host}/?verificationToken=${verificationToken}`;

  const emailDetails = {
      email, 
      verification_url
    }
    
    await emailSendingQueue.add('send-verification-email', { 
        funcName: 'resendVerificationEmail',
        args: [emailDetails]
    });

  res.status(StatusCodes.OK).json({ message: 'If that email exists, a verification email has been sent.' });
}


const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError('Email and Password are required.');
  }

  const user = await User.findOne({ email })

  if (!user) {
    throw new CustomError.UnauthorizedError('Invalid credentials.');
  }

  if (!user.isEmailVerified) {
    throw new CustomError.BadRequestError('Please verify your email before logging in.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new CustomError.UnauthorizedError('Invalid credentials.');
  }

  user.lastLogin = new Date();
  user.lastLoginMethod = 'email';
  await user.save();

  const token = {
        userId: user._id,
        role: user.role,
  };
  createCookies(res, token);

  res.status(StatusCodes.OK).json({
    message: 'Login successful.',
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      profileImage: user.profileImage,
      role: user.role,
      accountType: user.accountType,
    }
  });
};



const oauthCallback = async (req, res) => {
  const user = req.user;

  try {
    if (!user) {  
       return res.redirect(`${process.env.ALLOWED_ORIGIN}/login?error=auth_failed`);
    }

    // create subscription if this is their first OAuth login
    const existingSub = await Subscription.findOne({ user: user._id });

    if (!existingSub) {
        await Subscription.create({ user: user._id });
    }

    const token = {
        userId: user._id,
        role: user.role,
    };
    createCookies(res, token);

    res.redirect(`${process.env.CLIENT_URL}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};



const logout = async (req, res) => {
    try {
        res.cookie('token', 'logout', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            signed: true,
            expires: new Date(Date.now()),
            sameSite: 'strict'
        });

        res.status(StatusCodes.OK).json({
            success: true,
            msg: 'User logged out successfully'
        });
    } catch (error) {
        throw new CustomError.BadRequestError(error.message);
    }
};



const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError.BadRequestError('Email is required.');
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(StatusCodes.OK).json({ message: 'If that email exists, a reset link has been sent.' });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); 


  await user.save();

  // send verification email
  const protocol = req.protocol; 
  const host = req.get('host'); 

  const reset_url = `${protocol}://${host}/reset-password?token=${resetToken}`;

  const resetDetails = {
        email, 
        reset_url
    }
    
    await emailSendingQueue.add('send-reset-password-email', { 
        funcName: 'resetPasswordEmail',
        args: [resetDetails]
    });

  res.status(StatusCodes.OK).json({ message: 'If that email exists, a reset link has been sent.' });
};



const resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token) {
    throw new CustomError.BadRequestError('Reset token is required.');
  }

  if (!newPassword || !confirmPassword) {
    throw new CustomError.BadRequestError('New password and confirmation are required.');
  }

  if (newPassword !== confirmPassword) {
    throw new CustomError.BadRequestError('Passwords do not match.');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new CustomError.BadRequestError('Invalid or expired reset token.');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  res.status(StatusCodes.OK).json({ message: 'Password reset successfully. You can now log in.' });
};



module.exports = {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  oauthCallback,
  logout,
  forgotPassword,
  resetPassword,
};