import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const startServer = async () => {
  try {
    await connectDB();
    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
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
