require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB }               = require('./config/db'); 
const { notFound, errorHandler }  = require('./config/errors'); 


const authRoutes  = require('./routes/auth');
const bookRoutes  = require('./routes/books');
const usersRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const extRoutes   = require('./routes/external');
const adminRoutes = require('./routes/admin');
const msgRoutes   = require('./routes/messages');
const notifRoutes = require('./routes/notification');
const reportRoutes = require('./routes/reports');

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('dev'));

// Healthcheck
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth',          authRoutes);
app.use('/api/books',         bookRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/stats',         statsRoutes);
app.use('/api/ext',           extRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/messages',      msgRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/reports',       reportRoutes);


app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => app.listen(PORT, () => console.log(`API on :${PORT}`)))
  .catch(err => 
  { 
    console.error('DB connect error:', err?.message || err); 
    process.exit(1); 
  });

module.exports = app;
