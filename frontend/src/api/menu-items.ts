import { request } from './request';
import type {
  MenuItem,
  MenuItemCategory,
  PaginatedMenuItems,
} from '../types/menu-item';

interface FetchMenuItemsParams {
  keyword?: string;
  category?: MenuItemCategory;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export const fetchMenuItems = (params: FetchMenuItemsParams) => {
  const query = new URLSearchParams();

  if (params.keyword) query.append('keyword', params.keyword);
  if (params.category) query.append('category', params.category);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  return request<PaginatedMenuItems>(`/meals?${query.toString()}`, {
    signal: params.signal,
  });
};

export interface MenuItemPayload {
  name: string;
  description: string;
  priceCents: number;
  image: string;
  category: MenuItemCategory;
  isAvailable: boolean;
  isFeatured: boolean;
}

interface MenuItemResponse {
  meal: MenuItem;
}

export const createMenuItem = (payload: MenuItemPayload) => {
  return request<MenuItemResponse>('/meals', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((res) => ({
    menuItem: res.meal,
  }));
};

export const updateMenuItem = (
  menuItemId: string,
  payload: MenuItemPayload,
) => {
  return request<MenuItemResponse>(`/meals/${menuItemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((res) => ({
    menuItem: res.meal,
  }));
};

export const deleteMenuItem = (menuItemId: string) => {
  return request<MenuItemResponse>(`/meals/${menuItemId}`, {
    method: 'DELETE',
  }).then((res) => ({
    menuItem: res.meal,
  }));
};
