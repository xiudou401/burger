import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async () => {
  try {
    // env.ts已校验MONGO_URI存在，直接连接
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    // 精准捕获错误信息
    const errorMsg =
      error instanceof Error
        ? error.message
        : `Unknown error: ${String(error)}`;

    console.error('❌ MongoDB connection failed:', errorMsg);
    // 连接失败退出进程，避免服务挂起
    process.exit(1);
  }
};
