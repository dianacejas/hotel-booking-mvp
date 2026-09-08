import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hotel_booking_db';

/**
 * Establishes a connection to the local MongoDB instance.
 * The connection string is MongoDB Compass compatible so the same
 * database can be inspected graphically in Compass.
 */
export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[DB] MongoDB connected: ${MONGO_URI}`);
  } catch (err) {
    console.error('[DB] MongoDB connection error:', err.message);
    process.exit(1);
  }
}