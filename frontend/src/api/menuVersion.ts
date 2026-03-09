import { request } from './request';

export const fetchMenuVersion = async () => {
  const data = await request<{ menuVersion: string }>('/menuVersion');
  return data.menuVersion;
};
