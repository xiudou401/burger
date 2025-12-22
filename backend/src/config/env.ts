import dotenv from 'dotenv';

// 只加载一次.env，所有环境变量从这里导出
dotenv.config();

interface Env {
  PORT: string;
  MONGO_URI: string;
}

export const env: Env = {
  PORT: process.env.PORT ?? '3000',
  MONGO_URI: process.env.MONGO_URI!,
};

// 核心配置校验
if (!env.MONGO_URI) {
  throw new Error('❌ MONGO_URI is not defined in .env file!');
}
