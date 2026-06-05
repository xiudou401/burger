import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async () => {
  try {
    // env.ts already validates MONGO_URI.
    await mongoose.connect(env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : `Unknown error: ${String(error)}`;

    console.error('MongoDB connection failed:', errorMsg);
    process.exit(1);
  }
};
