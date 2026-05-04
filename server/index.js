require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB    = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { verifyMailer } = require('./config/mailer');

const authRoutes       = require('./routes/auth');
const medicationRoutes = require('./routes/medication');
const reportRoutes     = require('./routes/report');
const historyRoutes    = require('./routes/history');

connectDB();
verifyMailer();

const app = express();

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

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please wait.' },
});

app.use(globalLimiter);
app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/medication', medicationRoutes);
app.use('/api/report',     reportRoutes);
app.use('/api/history',    historyRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'MedAI API is running.', timestamp: new Date() });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, (err) => {
    if (err) {
        
        console.log(`Error in ${process.env.NODE_ENV}: ${err}`)
    }
    console.log(`🚀  MedAI server running on http://localhost:${PORT}`);
    console.log(`🌍  Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;