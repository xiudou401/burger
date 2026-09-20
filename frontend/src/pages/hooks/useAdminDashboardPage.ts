import { useCallback } from 'react';
import {
  fetchAdminAnalyticsSummary,
  fetchAdminDashboardSummary,
} from '../../api/admin-dashboard';
import type {
  AdminAnalyticsSummary,
  AdminDashboardSummary,
} from '../../types/admin-dashboard';
import { useAdminResource } from './useAdminResource';

interface AdminDashboardPageData {
  summary: AdminDashboardSummary;
  analytics: AdminAnalyticsSummary;
}

export const useAdminDashboardPage = () => {
  const loadDashboard = useCallback(async (signal: AbortSignal) => {
    const [summaryRes, analyticsRes] = await Promise.all([
      fetchAdminDashboardSummary(signal),
      fetchAdminAnalyticsSummary('7d', signal),
    ]);

    return {
      summary: summaryRes.summary,
      analytics: analyticsRes.analytics,
    };
  }, []);

  const { data, isLoading, error, refresh } =
    useAdminResource<AdminDashboardPageData | null>({
      initialData: null,
      load: loadDashboard,
      errorMessage: 'Could not load dashboard',
    });

  return {
    summary: data?.summary ?? null,
    analytics: data?.analytics ?? null,
    isLoading,
    error,
    refresh,
  };
};
