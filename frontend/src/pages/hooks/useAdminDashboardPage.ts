import { useCallback, useEffect } from 'react';
import {
  fetchAdminAnalyticsAlerts,
  fetchAdminAnalyticsSummary,
  fetchAdminDashboardSummary,
} from '../../api/admin-dashboard';
import { connectAdminRealtime } from '../../api/realtime';
import type {
  AdminAnalyticsAlert,
  AdminAnalyticsSummary,
  AdminDashboardSummary,
} from '../../types/admin-dashboard';
import { useAdminResource } from './useAdminResource';

interface AdminDashboardPageData {
  summary: AdminDashboardSummary;
  analytics: AdminAnalyticsSummary;
  alerts: AdminAnalyticsAlert[];
}

export const useAdminDashboardPage = () => {
  const loadDashboard = useCallback(async (signal: AbortSignal) => {
    const [summaryRes, analyticsRes, alertsRes] = await Promise.all([
      fetchAdminDashboardSummary(signal),
      fetchAdminAnalyticsSummary('7d', signal),
      fetchAdminAnalyticsAlerts('7d', signal),
    ]);

    return {
      summary: summaryRes.summary,
      analytics: analyticsRes.analytics,
      alerts: alertsRes.alerts,
    };
  }, []);

  const { data, isLoading, error, refresh } =
    useAdminResource<AdminDashboardPageData | null>({
      initialData: null,
      load: loadDashboard,
      errorMessage: 'Could not load dashboard',
    });

  useEffect(() => {
    let refreshTimeout: number | null = null;
    const scheduleRefresh = () => {
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }

      refreshTimeout = window.setTimeout(() => {
        void refresh();
      }, 500);
    };

    const socket = connectAdminRealtime({
      onOrderEvent: scheduleRefresh,
      onMenuUpdated: scheduleRefresh,
      onAnalyticsAlert: scheduleRefresh,
    });

    return () => {
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }

      socket?.disconnect();
    };
  }, [refresh]);

  return {
    summary: data?.summary ?? null,
    analytics: data?.analytics ?? null,
    alerts: data?.alerts ?? [],
    isLoading,
    error,
    refresh,
  };
};
