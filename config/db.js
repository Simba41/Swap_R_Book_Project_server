const mongoose = require('mongoose');

async function connectDB() 
{
  const url = process.env.MONGO_URL;

  if (!url) 
    throw new Error('MONGO_URL is not set');

  const masked = url.replace(/(mongodb\+srv:\/\/[^:]+):[^@]+@/, '$1:***@');
  console.log('[DB] Connecting to:', masked);

  try 
  {
    await mongoose.connect(url, { autoIndex: true, serverSelectionTimeoutMS: 10000 });
    console.log('[DB] MongoDB connected');
  } catch (err) 
  {
    console.error('[DB] Auth/Connect error:', err?.message || err);
    throw err;
  }
}

module.exports = { connectDB };
