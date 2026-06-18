import mongoose from 'mongoose';

let connected = false;

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    connected = false;
    return false;
  }

  if (connected || mongoose.connection.readyState === 1) {
    connected = true;
    return true;
  }

  await mongoose.connect(uri, {
    autoIndex: true,
  });

  connected = true;
  return true;
}

export function isMongoReady() {
  return connected && mongoose.connection.readyState === 1;
}