import { request } from './request';

export const fetchMenuVersion = async () => {
  const data = await request<{ menuVersion: number }>('/menu-version');
  return data.menuVersion;
};
