require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB          = require('./config/database');
const { verifySupabase } = require('./config/supabase');
const errorHandler       = require('./middleware/errorHandler');

const authRoutes       = require('./routes/auth');
const medicationRoutes = require('./routes/medication');
const reportRoutes     = require('./routes/report');
const historyRoutes    = require('./routes/history');

connectDB();
verifySupabase();

const app = express();

// ─── FIX: Trust the reverse proxy (Render / Railway / Vercel / etc.) ──────────
// Without this, Express sees X-Forwarded-For headers from the proxy but refuses
// to trust them, causing express-rate-limit to throw ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
// '1' means trust exactly one proxy hop (the platform's load balancer).
app.set('trust proxy', 1);

// ─── Core middleware ───────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ─── Rate limiters ─────────────────────────────────────────────────────────────
// FIX: Add validate: false to suppress the ERR_ERL_FORWARDED_HEADER warning
// about the 'Forwarded' header. The trust proxy setting above already handles
// X-Forwarded-For correctly; this just silences the secondary validation check.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, message: 'Too many auth attempts. Please wait.' },
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use(globalLimiter);
app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/medication', medicationRoutes);
app.use('/api/report',     reportRoutes);
app.use('/api/history',    historyRoutes);

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'MedAI API is running.', timestamp: new Date() });
});

// ─── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  MedAI server running on http://localhost:${PORT}`);
  console.log(`🌍  Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;