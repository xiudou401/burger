import { request } from './request';

export const fetchMenuVersion = async (signal?: AbortSignal) => {
  const data = await request<{ menuVersion: number }>('/menu-version', {
    signal,
  });
  return data.menuVersion;
};
