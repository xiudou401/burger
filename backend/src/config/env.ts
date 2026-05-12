import dotenv from 'dotenv';

// 只加载一次.env，所有环境变量从这里导出
dotenv.config();

interface Env {
  PORT: string;
  MONGO_URI: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  API_URL: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

export const env: Env = {
  PORT: process.env.PORT ?? '3000',
  MONGO_URI: process.env.MONGO_URI!,
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  API_URL: process.env.API_URL ?? `http://localhost:${process.env.PORT ?? '3000'}`,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
};

// 核心配置校验
if (!env.MONGO_URI) {
  throw new Error('❌ MONGO_URI is not defined in .env file!');
}
