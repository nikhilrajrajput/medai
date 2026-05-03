const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { askGeminiWithFile, parseJSON } = require('../config/gemini');
const SearchHistory = require('../models/SearchHistory');

const router = express.Router();

// ─── Multer - memory storage (no disk writes) ─────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WEBP and PDF files are allowed.'));
    }
  },
});

const REPORT_PROMPT = `
You are a senior radiologist ,genral physician and clinical consultant. Analyze this medical report/image thoroughly.

Return ONLY valid JSON (no markdown fences) in exactly this structure:
{
  "title": "Type of report (e.g. CBC Blood Test, Chest X-Ray, MRI Brain)",
  "summary": "2-3 sentence clinical overview of all findings",
  "findings": ["finding 1", "finding 2", "finding 3"],
  "abnormalValues": [
    {"parameter": "name", "value": "patient value", "normal": "normal range", "flag": "HIGH or LOW"}
  ],
  "diagnoses": ["possible diagnosis 1", "possible diagnosis 2"],
  "imagingRecommended": ["MRI Brain with contrast", "CT Chest"],
  "surgicalInterventions": ["intervention if needed"] ,
  "medicationsSuggested": [
    {"name": "medication name", "reason": "why it is suggested"}
  ],
  "lifestyleAdvice": ["advice 1", "advice 2"],
  "specialistReferral": ["Cardiologist", "Neurologist"],
  "urgency": "routine | soon | urgent | emergency",
  "urgencyReason": "Why this urgency level was chosen",
  "followUp": "Recommended follow-up timeline and plan"
}

If the document is not a medical report, return:
{"error": true, "message": "Not a medical document"}

Respond ONLY with JSON.
`;

// ─── POST /api/report/analyze ──────────────────────────────────────────────────
router.post('/analyze', protect, upload.single('report'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const raw = await askGeminiWithFile(base64, mimeType, REPORT_PROMPT);

    let data;
    try {
      data = parseJSON(raw);
    } catch {
      return res.status(422).json({ success: false, message: 'AI response could not be parsed.' });
    }

    if (data.error) {
      return res.status(400).json({ success: false, message: data.message });
    }

    await SearchHistory.create({
      user: req.user._id,
      type: 'report',
      query: data.title || req.file.originalname,
      fileName: req.file.originalname,
      result: data,
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/report/history ───────────────────────────────────────────────────
router.get('/history', protect, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await SearchHistory.find({ user: req.user._id, type: 'report' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('query fileName result createdAt');
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

module.exports = router;