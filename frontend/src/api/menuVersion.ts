import { request } from './request';

export const fetchMenuVersion = async () => {
  const data = await request<{ menuVersion: number }>('/menuVersion');
  console.log('data', data);
  return data.menuVersion;
};
