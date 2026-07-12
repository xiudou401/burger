import mongoose from 'mongoose';
import { env } from './env';
import { appLogger } from '../utils/logger';

export const connectDB = async () => {
  try {
    // env.ts already validates MONGO_URI.
    await mongoose.connect(env.MONGO_URI);
    appLogger.info('mongodb_connected');
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : `Unknown error: ${String(error)}`;

    appLogger.error('mongodb_connection_failed', { message: errorMsg });
    process.exit(1);
  }
};
