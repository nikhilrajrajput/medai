const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
// const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// ─── Token factory ─────────────────────────────────────────────────────────────
const makeTokens = (userId) => ({
  accessToken: jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  }),
  refreshToken: jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  }),
});

// ─── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const tokens = makeTokens(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user: user.toJSON(), ...tokens },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: 'Account deactivated.' });
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
      return res
        .status(401)
        .json({ success: false, message: 'Refresh token required.' });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid refresh token.' });
    }
    res.json({ success: true, data: makeTokens(user._id) });
  } catch {
    res
      .status(401)
      .json({ success: false, message: 'Invalid or expired refresh token.' });
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
