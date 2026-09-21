import { request } from './request';
import type {
  AdminAnalyticsAlert,
  AdminAnalyticsSummary,
  AdminDailyBrief,
  AdminDashboardSummary,
  AnalyticsRange,
} from '../types/admin-dashboard';

export const fetchAdminDashboardSummary = (signal?: AbortSignal) => {
  return request<{ summary: AdminDashboardSummary }>(
    '/admin/dashboard/summary',
    {
      signal,
    },
  );
};

export const fetchAdminDailyBrief = (signal?: AbortSignal) => {
  return request<{ brief: AdminDailyBrief }>('/admin/dashboard/daily-brief', {
    signal,
  });
};

export const fetchAdminAnalyticsAlerts = (
  range: AnalyticsRange,
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams({ range });

  return request<{ alerts: AdminAnalyticsAlert[] }>(
    `/admin/dashboard/alerts?${query.toString()}`,
    {
      signal,
    },
  );
};

export const fetchAdminAnalyticsSummary = (
  range: AnalyticsRange,
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams({ range });

  return request<{ analytics: AdminAnalyticsSummary }>(
    `/admin/dashboard/analytics?${query.toString()}`,
    {
      signal,
    },
  );
};
