import { useCallback, useEffect } from 'react';
import {
  fetchAdminAnalyticsAlerts,
  fetchAdminAnalyticsSummary,
  fetchAdminDailyBrief,
  fetchAdminDashboardSummary,
} from '../../api/admin-dashboard';
import { connectAdminRealtime } from '../../api/realtime';
import type {
  AdminAnalyticsAlert,
  AdminAnalyticsSummary,
  AdminDailyBrief,
  AdminDashboardSummary,
} from '../../types/admin-dashboard';
import { useAdminResource } from './useAdminResource';
import { createFallbackPolling } from '../../utils/fallback-polling';

interface AdminDashboardPageData {
  brief: AdminDailyBrief;
  summary: AdminDashboardSummary;
  analytics: AdminAnalyticsSummary;
  alerts: AdminAnalyticsAlert[];
}

export const useAdminDashboardPage = () => {
  const loadDashboard = useCallback(async (signal: AbortSignal) => {
    const [briefRes, summaryRes, analyticsRes, alertsRes] = await Promise.all([
      fetchAdminDailyBrief(signal),
      fetchAdminDashboardSummary(signal),
      fetchAdminAnalyticsSummary('7d', signal),
      fetchAdminAnalyticsAlerts('7d', signal),
    ]);

    return {
      brief: briefRes.brief,
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
    const polling = createFallbackPolling(() => refresh());

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
      onConnected: () => {
        polling.stop();
        void refresh();
      },
      onDisconnected: polling.start,
    });

    if (!socket) {
      polling.start();
    }

    return () => {
      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }

      polling.dispose();
      socket?.disconnect();
    };
  }, [refresh]);

  return {
    brief: data?.brief ?? null,
    summary: data?.summary ?? null,
    analytics: data?.analytics ?? null,
    alerts: data?.alerts ?? [],
    isLoading,
    error,
    refresh,
  };
};
