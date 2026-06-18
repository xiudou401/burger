import { request } from './request';
import type { AuthResponse, User } from '../types/auth';

interface MessageResponse {
  message: string;
  user?: User;
  resetToken?: string;
  emailVerificationToken?: string;
  devSmsCode?: string;
}

export const signup = (name: string, email: string, password: string) => {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
};

export const login = (email: string, password: string) => {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });
};

export const refreshSession = () => {
  return request<AuthResponse>('/auth/refresh', {
    method: 'POST',
  });
};

export const logout = () => {
  return request<void>('/auth/logout', {
    method: 'POST',
  });
};

export const verifyEmail = (token: string) => {
  return request<MessageResponse>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
};

export const resendVerificationEmail = () => {
  return request<MessageResponse>('/auth/resend-verification', {
    method: 'POST',
  });
};

export const forgotPassword = (email: string) => {
  return request<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const resetPassword = (token: string, password: string) => {
  return request<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
};

export const sendSmsCode = (phone: string) => {
  return request<MessageResponse>('/auth/sms/send', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
};

export const verifySmsCode = (phone: string, code: string) => {
  return request<AuthResponse>('/auth/sms/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
};
