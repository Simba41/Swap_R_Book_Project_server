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
    mongoose.set('strictQuery', true);

    await mongoose.connect(url, 
    {
      autoIndex: true,                 
      maxPoolSize: 10,                 
      serverSelectionTimeoutMS: 7000, 
      dbName: process.env.MONGO_DBNAME || undefined,
    });

    console.log('[DB] MongoDB connected');
  } catch (err) 
  {
    console.error('[DB] Auth/Connect error:', err?.message || err);
    throw err;
  }
}

module.exports = { connectDB };
