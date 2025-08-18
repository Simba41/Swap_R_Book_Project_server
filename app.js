require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB }              = require('./db');
const { notFound, errorHandler } = require('./errors');

const authRoutes  = require('./auth');
const bookRoutes  = require('./books');
const usersRoutes = require('./users');
const statsRoutes = require('./stats');
const extRoutes   = require('./external');

const app  = express();
const PORT = process.env.PORT || 3000;

const ALLOWED = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) 
  {
    if (!origin || ALLOWED.includes(origin)) 
      return cb(null, true);

    return cb(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json({ limit: '3mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth',  authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ext',   extRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => 
  {
    app.listen(PORT, '0.0.0.0', () => 
    {
      console.log(`✅ API running on port ${PORT}`);
    });
  })
  .catch(err => 
  {
    console.error('❌ DB connect error:', err?.message || err);
    process.exit(1);
  });

module.exports = app;
