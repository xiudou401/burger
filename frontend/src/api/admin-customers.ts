import { request } from './request';
import type {
  AdminCustomer,
  CustomerStatus,
  PaginatedAdminCustomers,
} from '../types/admin-customer';

interface FetchCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  signal?: AbortSignal;
  status?: CustomerStatus | '';
}

const buildQuery = ({ page, limit, search, status }: FetchCustomersParams) => {
  const query = new URLSearchParams();

  if (page) query.set('page', String(page));
  if (limit) query.set('limit', String(limit));
  if (search?.trim()) query.set('search', search.trim());
  if (status) query.set('status', status);

  return query.toString();
};

export const fetchAdminCustomers = (params: FetchCustomersParams = {}) => {
  const query = buildQuery(params);

  return request<PaginatedAdminCustomers>(
    `/admin/customers${query ? `?${query}` : ''}`,
    { signal: params.signal },
  );
};

export const disableAdminCustomer = (customerId: string, reason?: string) => {
  return request<{ customer: AdminCustomer }>(
    `/admin/customers/${customerId}/disable`,
    {
      method: 'POST',
      body: JSON.stringify({ ...(reason?.trim() ? { reason } : {}) }),
    },
  );
};

export const enableAdminCustomer = (customerId: string) => {
  return request<{ customer: AdminCustomer }>(
    `/admin/customers/${customerId}/enable`,
    {
      method: 'POST',
    },
  );
};
