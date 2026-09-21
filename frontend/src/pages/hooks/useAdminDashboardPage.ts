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

const REALTIME_FALLBACK_POLL_MS = 30_000;

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
    let fallbackTimer: number | null = null;
    let isDisposed = false;

    const clearFallbackPolling = () => {
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const startFallbackPolling = () => {
      if (isDisposed || fallbackTimer !== null) return;

      const tick = () => {
        if (isDisposed) return;

        void refresh();
        fallbackTimer = window.setTimeout(tick, REALTIME_FALLBACK_POLL_MS);
      };

      fallbackTimer = window.setTimeout(tick, REALTIME_FALLBACK_POLL_MS);
    };

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
        clearFallbackPolling();
        void refresh();
      },
      onDisconnected: startFallbackPolling,
    });

    if (!socket) {
      startFallbackPolling();
    }

    return () => {
      isDisposed = true;

      if (refreshTimeout !== null) {
        window.clearTimeout(refreshTimeout);
      }

      clearFallbackPolling();
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
