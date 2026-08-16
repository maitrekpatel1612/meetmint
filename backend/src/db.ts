import mongoose from 'mongoose';

// ── Singleton: one connection shared across all serverless invocations ────────
// Mongoose caches the connection internally; this guard prevents re-connecting
// when the module is re-imported in tests or hot reloads.

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    console.log('[db] reusing existing MongoDB connection');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('[db] MONGODB_URI is not defined in environment variables');
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'meetmint',
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[db] connected to MongoDB Atlas');
  } catch (err) {
    console.error('[db] connection failed:', err);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[db] disconnected from MongoDB');
}

export default mongoose;
