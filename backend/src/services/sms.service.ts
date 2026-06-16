import { randomInt } from 'crypto';

export const createSmsCode = () => {
  return String(randomInt(100000, 1000000));
};

export const isDevSmsMode = () => {
  return process.env.NODE_ENV !== 'production';
};

export const sendSmsVerificationCode = async ({
  phone,
  code,
}: {
  phone: string;
  code: string;
}) => {
  if (isDevSmsMode()) {
    console.log(`[dev sms] ${phone}: ${code}`);
    return;
  }

  throw new Error('SMS provider is not configured');
};
