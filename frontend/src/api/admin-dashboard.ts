import { request } from './request';
import type { AdminDashboardSummary } from '../types/admin-dashboard';

export const fetchAdminDashboardSummary = (signal?: AbortSignal) => {
  return request<{ summary: AdminDashboardSummary }>(
    '/admin/dashboard/summary',
    {
      signal,
    },
  );
};
