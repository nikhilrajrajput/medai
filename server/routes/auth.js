const express  = require('express');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const dotenv   = require('dotenv');
dotenv.config();
const { protect }           = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { supabase }          = require('../config/supabase');

const router = express.Router();

// ─── JWT token factory ────────────────────────────────────────────────────────
const makeTokens = (userId) => ({
  accessToken: jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  }),
  refreshToken: jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  }),
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Creates user in MongoDB (unverified) + triggers Supabase OTP email
router.post('/register', validate(schemas.register), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if verified user already exists in MongoDB
    const existing = await User.findOne({ email });
    if (existing && existing.isVerified) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    // If unverified account exists, resend OTP
    if (existing && !existing.isVerified) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw new Error(error.message);
      return res.status(200).json({
        success: true,
        message: 'Account exists but is unverified. A new OTP has been sent to your email.',
        data: { email, requiresVerification: true },
      });
    }

    // Create new unverified user in MongoDB (store name + hashed password)
    await User.create({ name, email, password, isVerified: false });

    // Trigger Supabase OTP email - Supabase sends the email automatically
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw new Error(error.message);

    res.status(201).json({
      success: true,
      message: 'Account created! Check your email for the 6-digit verification code.',
      data: { email, requiresVerification: true },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
// Verifies OTP via Supabase, then issues our own JWT
router.post('/verify-otp', validate(schemas.verifyOtp), async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Verify OTP with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) {
      // Map Supabase error messages to friendly responses
      const msg = error.message.toLowerCase();
      if (msg.includes('expired')) {
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }
      if (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('not found')) {
        return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
      }
      return res.status(400).json({ success: false, message: error.message });
    }

    // OTP verified — mark user as verified in MongoDB
    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true, lastLogin: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in database.' });
    }

    const tokens = makeTokens(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to MedAI.',
      data: { user: user.toJSON(), ...tokens },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/resend-otp ────────────────────────────────────────────────
router.post('/resend-otp', validate(schemas.resendOtp), async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified.' });
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) throw new Error(error.message);

    res.json({ success: true, message: 'A new OTP has been sent to your email.' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', validate(schemas.login), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated.' });
    }
    if (!user.isVerified) {
      // Auto-resend OTP via Supabase
      await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent to your email.',
        data: { email, requiresVerification: true },
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const tokens = makeTokens(user._id);
    res.json({
      success: true,
      message: 'Login successful.',
      data: { user: user.toJSON(), ...tokens },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required.' });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }
    res.json({ success: true, data: makeTokens(user._id) });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, data: { user: req.user.toJSON() } });
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', protect, (_req, res) => {
  res.json({ success: true, message: 'Logged out.' });
});

module.exports = router;