const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect }                    = require('../middleware/auth');
const { validate, schemas }          = require('../middleware/validation');
const { generateOTP, sendOTPEmail }  = require('../config/mailer');

const router = express.Router();

// ─── Token factory ────────────────────────────────────────────────────────────
const makeTokens = (userId) => ({
  accessToken: jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  }),
  refreshToken: jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  }),
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
// Step 1: Create unverified account and send OTP
router.post('/register', validate(schemas.register), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if a verified user already exists
    const existing = await User.findOne({ email }).select('+otp +otpExpiresAt +otpAttempts');
    if (existing) {
      if (existing.isVerified) {
        return res.status(409).json({ success: false, message: 'Email already registered.' });
      }
      // Unverified account exists — resend OTP
      const otp = generateOTP();
      existing.setOTP(otp);
      await existing.save({ validateBeforeSave: false });
      await sendOTPEmail(email, otp, existing.name);
      return res.status(200).json({
        success: true,
        message: 'Account already exists but is unverified. A new OTP has been sent.',
        data: { email, requiresVerification: true },
      });
    }

    // Create new unverified user
    const user = await User.create({ name, email, password, isVerified: false });

    // Generate and send OTP
    const otp = generateOTP();
    await User.findByIdAndUpdate(
      user._id,
      { otp, otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), otpAttempts: 0 },
      { select: false }
    );

    await sendOTPEmail(email, otp, name);

    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email for the 6-digit verification code.',
      data: { email, requiresVerification: true },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/verify-otp ────────────────────────────────────────────────
// Step 2: Verify the OTP — returns tokens on success
router.post('/verify-otp', validate(schemas.verifyOtp), async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+otp +otpExpiresAt +otpAttempts');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified.' });
    }

    const result = user.verifyOTP(otp);

    if (result === 'too_many') {
      return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
    }
    if (result === 'expired') {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    if (result === 'wrong') {
      await user.save({ validateBeforeSave: false });
      const remaining = 5 - user.otpAttempts;
      return res.status(400).json({ success: false, message: `Incorrect OTP. ${remaining} attempt(s) remaining.` });
    }
    if (result === 'invalid') {
      return res.status(400).json({ success: false, message: 'No OTP found. Please register again.' });
    }

    // ─── OTP is correct ────────────────────────────────────────────────────
    user.isVerified = true;
    user.lastLogin  = new Date();
    user.clearOTP();
    await user.save({ validateBeforeSave: false });

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

    const user = await User.findOne({ email }).select('+otp +otpExpiresAt +otpAttempts');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified.' });
    }

    // Rate limit resend — don't allow resend if OTP still has > 8 min remaining
    if (user.otpExpiresAt && (user.otpExpiresAt.getTime() - Date.now()) > 8 * 60 * 1000) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting a new OTP.',
      });
    }

    const otp = generateOTP();
    user.setOTP(otp);
    await user.save({ validateBeforeSave: false });
    await sendOTPEmail(email, otp, user.name);

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
      // Resend OTP silently
      const otp = generateOTP();
      await User.findByIdAndUpdate(user._id, {
        otp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        otpAttempts: 0,
      });
      await sendOTPEmail(email, otp, user.name);
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent.',
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