import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const startServer = async () => {
  try {
    await connectDB();
    app.listen(Number(env.PORT), '0.0.0.0', () => {
      console.log(`Server running on 0.0.0.0:${env.PORT}`);
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : `Unknown error: ${String(error)}`;

    console.error('Server startup failed:', errorMsg);
    process.exit(1);
  }
};

startServer();
