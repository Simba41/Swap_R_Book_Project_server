require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB }              = require('./config/db');
const { notFound, errorHandler } = require('./config/errors');

const authRoutes  = require('./routes/auth');
const bookRoutes  = require('./routes/books');
const usersRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const extRoutes   = require('./routes/external');

const app  = express();
const PORT = process.env.PORT || 3000;


const ALLOWED = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = 
{
  origin(origin, cb) 
  {
    if (!origin) 
      return cb(null, true);

    
    if (ALLOWED.length === 0) 
      return cb(null, true);

    
    if (ALLOWED.includes(origin)) 
      return cb(null, true);


    return cb(new Error('CORS: origin not allowed: ' + origin));
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, 
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));


app.use(express.json({ limit: '3mb' }));
app.use(morgan('dev'));


app.get('/api/health', (_req, res) => res.json({ ok: true }));


app.use('/api/auth',  authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ext',   extRoutes);


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
