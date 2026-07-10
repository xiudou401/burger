import { request } from './request';
import type { AdminDashboardSummary } from '../types/admin-dashboard';

export const fetchAdminDashboardSummary = () => {
  return request<{ summary: AdminDashboardSummary }>(
    '/admin/dashboard/summary',
  );
};
