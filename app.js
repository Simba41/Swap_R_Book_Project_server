require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB }              = require('./config/db');
const { notFound, errorHandler } = require('./config/errors');


const authRoutes    = require('./routes/auth');
const bookRoutes    = require('./routes/books');
const usersRoutes   = require('./routes/users');
const statsRoutes   = require('./routes/stats');
const externalRoutes= require('./routes/external');   
const adminRoutes   = require('./routes/admin');
const msgRoutes     = require('./routes/messages');
const notifRoutes   = require('./routes/notification');
const reportRoutes  = require('./routes/reports');
const swapRoutes    = require('./routes/swaps');

const app  = express();
const PORT = process.env.PORT || 3000;

if (!process.env.MONGO_URL)  
{ 
  console.error('MONGO_URL is not set');  
  process.exit(1); 
}

if (!process.env.JWT_SECRET) 
{ 
  console.error('JWT_SECRET is not set'); 
  process.exit(1); 
}

app.set('trust proxy', 1);


const ALLOWED = (process.env.CORS_ORIGIN || '')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors(
{
  origin(origin, cb) 
  {
    if (!origin || ALLOWED.includes(origin)) 
      return cb(null, true);

    return cb(new Error('Not allowed by CORS'));
  }
}));
app.use((err, _req, res, next) => 
  {
  if (err?.message === 'Not allowed by CORS')
    return res.status(403).json({ message: 'CORS: origin not allowed' });
  return next(err);
});
app.options('*', cors());


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));


app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/', (req, res) => res.json({ ok: true, message: 'API is running' }));


app.use('/api/auth',          authRoutes);
app.use('/api/books',         bookRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/stats',         statsRoutes);
app.use('/api/ext',           externalRoutes); 
app.use('/api/admin',         adminRoutes);
app.use('/api/messages',      msgRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/swaps',         swapRoutes);


app.use(notFound);
app.use(errorHandler);


connectDB()
  .then(() => app.listen(PORT, () => console.log(`API on :${PORT}`)))
  .catch(err => 
  {
    console.error('DB connect error:', err?.message || err);
    process.exit(1);
  });

process.on('unhandledRejection', r => console.error('[UNHANDLED]', r));
process.on('uncaughtException', e => 
{ 
  console.error('[UNCAUGHT]', e); 
  process.exit(1); 
});

module.exports = app;