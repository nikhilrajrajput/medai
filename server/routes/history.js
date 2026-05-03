const express = require('express');
const { protect } = require('../middleware/auth');
const SearchHistory = require('../models/SearchHistory');

const router = express.Router();

// ─── GET /api/history ─── All history for current user ────────────────────────
router.get('/', protect, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const type = req.query.type; // optional filter: 'medication' | 'report'

    const filter = { user: req.user._id };
    if (type) filter.type = type;

    const history = await SearchHistory.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('type query fileName createdAt');

    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/history/:id ── Delete a single record ────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const record = await SearchHistory.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/history ── Clear all history for user ────────────────────────
router.delete('/', protect, async (req, res, next) => {
  try {
    await SearchHistory.deleteMany({ user: req.user._id });
    res.json({ success: true, message: 'History cleared.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;