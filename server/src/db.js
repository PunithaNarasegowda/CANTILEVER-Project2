import mongoose from 'mongoose';

let connected = false;

export async function connectDatabase() {
  console.log("connectDatabase called");

  const uri = process.env.MONGODB_URI;

  console.log("URI exists:", !!uri);

  if (!uri) {
    connected = false;
    return false;
  }

  if (connected || mongoose.connection.readyState === 1) {
    connected = true;
    return true;
  }

  await mongoose.connect(uri);


  connected = true;
  return true;
}

export function isMongoReady() {
  return connected && mongoose.connection.readyState === 1;
}