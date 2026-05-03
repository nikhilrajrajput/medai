const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Text-only model ──────────────────────────────────────────────────────────
const getTextModel = () => genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' }); //gemini-3-flash-preview - gemini-3.1-flash-lite-preview

// ─── Vision/multimodal model ──────────────────────────────────────────────────
const getVisionModel = () =>
  genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });  //gemini-3-flash-preview - gemini-3.1-flash-lite-preview

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ask Gemini a text prompt and return the raw text response.
 */
const askGemini = async (prompt) => {
  const model = getTextModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
};

/**
 * Send an image/PDF (as base64) + prompt to Gemini vision and return text.
 * @param {string} base64Data  - raw base64 string (no data-URL prefix)
 * @param {string} mimeType    - e.g. 'image/jpeg', 'application/pdf'
 * @param {string} prompt      - text instruction
 */
const askGeminiWithFile = async (base64Data, mimeType, prompt) => {
  const model = getVisionModel();
  const result = await model.generateContent([
    { inlineData: { data: base64Data, mimeType } },
    prompt,
  ]);
  return result.response.text();
};

/**
 * Safely parse JSON from a Gemini response that may include markdown fences.
 */
const parseJSON = (text) => {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  return JSON.parse(cleaned);
};

module.exports = { askGemini, askGeminiWithFile, parseJSON };