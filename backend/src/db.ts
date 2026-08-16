import mongoose from 'mongoose';
import dns from 'node:dns';

// Fix Windows DNS querySrv ECONNREFUSED for mongodb+srv:// Atlas URIs
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore if custom DNS cannot be set in certain environments
}

// ── Singleton: one connection shared across all serverless invocations ────────
// Mongoose caches the connection internally; this guard prevents re-connecting
// when the module is re-imported in tests or hot reloads.

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    console.log('[db] Reusing existing MongoDB Atlas connection');
    return;
  }

  const uri = process.env.MONGODB_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error('\n❌ [db error] MONGODB_URL / MONGODB_URI is not defined in backend/.env!');
    console.error('Please configure your MongoDB Atlas connection string in backend/.env (e.g. MONGODB_URL=mongodb+srv://...)\n');
    return;
  }

  try {
    console.log('[db] Connecting to MongoDB Atlas...');
    await mongoose.connect(uri, {
      dbName: 'meetmint',
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✅ [db] Successfully connected to MongoDB Atlas (meetmint database)');
  } catch (err: any) {
    console.error('\n❌ [db error] Failed to connect to MongoDB Atlas:');
    console.error(`Reason: ${err?.message || err}`);
    if (err?.name === 'MongoServerSelectionError') {
      console.error('Tip: Check your Atlas Network Access (IP Whitelist / 0.0.0.0/0) and database credentials.\n');
    }
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('[db] Disconnected from MongoDB Atlas');
}

export default mongoose;
