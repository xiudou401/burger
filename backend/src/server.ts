import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { appLogger } from './utils/logger';

const startServer = async () => {
  try {
    await connectDB();
    app.listen(Number(env.PORT), '0.0.0.0', () => {
      appLogger.info('server_started', {
        host: '0.0.0.0',
        port: env.PORT,
      });
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : `Unknown error: ${String(error)}`;

    appLogger.error('server_startup_failed', { message: errorMsg });
    process.exit(1);
  }
};

startServer();
