const express = require('express');
const { protect } = require('../middleware/auth');
const { askGemini, parseJSON } = require('../config/gemini');
const SearchHistory = require('../models/SearchHistory');

const router = express.Router();

const MEDICATION_PROMPT = (name) => `
You are a senior clinical pharmacist. Provide comprehensive medication information for: ${name}.

Return ONLY valid JSON (no markdown fences, no extra text) in exactly this structure:
{
  "name": "Full generic name (Brand name)",
  "class": "Drug class and category",
  "dosage": "Standard adult dosage with range",
  "pediatricDosage": "Pediatric dosage if applicable, or null",
    "summary":"Summary of the medicine why it used Example:- "it uses for fever cold cough headpain"",
    "dietSuggestion": "Foods that provide more benefits, for example: "eat one pineapple fruit a day"",
  "quantity": "Tablets/capsules per dose",
  "frequency": "How often to take (e.g. twice daily)",
  "timing": "Optimal timing relative to meals and time of day",
  "method": "Route and method of administration",
  "indications": ["indication 1", "indication 2", "indication 3"],
  "contraindications": ["contraindication 1", "contraindication 2"],
  "sideEffects": {
    "common": ["side effect 1", "side effect 2"],
    "serious": ["serious effect 1", "serious effect 2"]
  },
  "interactions": ["interaction 1", "interaction 2"],
  "precautions": ["precaution 1", "precaution 2"],
  "storage": "Storage instructions",
  "pregnancyCategory": "FDA pregnancy category and notes",
  "overdose": "Signs of overdose and what to do"
}

If the medication is not found or name is unclear, return:
{"error": true, "message": "Medication not found", "suggestion": "Did you mean X?"}

Respond ONLY with JSON.
`;

// ─── POST /api/medication/search ──────────────────────────────────────────────
router.post('/search',protect, async (req, res, next) => {
  try {
    const { medicationName } = req.body;
    const raw = await askGemini(MEDICATION_PROMPT(medicationName));

    let data;
    try {
      data = parseJSON(raw);
    } catch {
      return res.status(422).json({ success: false, message: 'AI response could not be parsed.' });
    }

    if (data.error) {
      return res.status(404).json({ success: false, message: data.message, suggestion: data.suggestion });
    }

    await SearchHistory.create({
      user: req.user._id,
      type: 'medication',
      query: medicationName,
      result: data,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/medication/history ───────────────────────────────────────────────
router.get('/history', protect, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await SearchHistory.find({ user: req.user._id, type: 'medication' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('query result createdAt');
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

module.exports = router;