import { request } from './request';
import type { AuthResponse } from '../types/auth';

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
