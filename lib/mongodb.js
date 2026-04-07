import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const maxPool = Math.min(
      200,
      Math.max(5, Number(process.env.MONGODB_MAX_POOL_SIZE) || 50)
    );
    const minPool = Math.min(maxPool, Math.max(0, Number(process.env.MONGODB_MIN_POOL_SIZE) || 2));

    const opts = {
      bufferCommands: false,
      maxPoolSize: maxPool,
      minPoolSize: minPool,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
