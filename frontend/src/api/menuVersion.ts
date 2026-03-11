import { request } from './request';

export const fetchMenuVersion = async () => {
  const data = await request<{ menuVersion: number }>('/menuVersion');
  return data.menuVersion;
};
