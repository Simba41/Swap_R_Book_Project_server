require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB }     = require('./config/db');
const { notFound, errorHandler } = require('./config/errors');

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');

const app    = express();
const PORT   = process.env.PORT || 3000;
const ORIGIN = process.env.CORS_ORIGIN || '*';

// ── middleware ─────────────────────────────────────────────────────────
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// ── health ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ── routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/books', bookRoutes);

// ── errors ─────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── start ──────────────────────────────────────────────────────────────
connectDB()
  .then(() => 
  {
    app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
  })
  .catch(err => 
  {
    console.error('DB connect error:', err?.message || err);
    process.exit(1);
  });

module.exports = app;
