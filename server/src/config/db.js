import mongoose from 'mongoose';

let memoryServer = null;

/**
 * Connect to MongoDB.
 * Uses MONGODB_URI (e.g. Atlas) when set. Otherwise spins up an in-memory
 * MongoDB so the app runs with zero external setup (data resets on restart).
 */
export async function connectDB() {
  let uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.warn('⚠️  MONGODB_URI not set — using in-memory MongoDB (data is not persisted).');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: 'storepilot' });

  const host = memoryServer ? 'in-memory' : mongoose.connection.host;
  console.log(`✅ MongoDB connected (${host})`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
