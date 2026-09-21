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

const REALTIME_FALLBACK_POLL_MS = 30_000;

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
    let fallbackTimer: number | null = null;
    let isDisposed = false;
    let fallbackActive = false;

    const clearFallbackPolling = () => {
      fallbackActive = false;

      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const startFallbackPolling = () => {
      if (isDisposed || fallbackActive) return;

      fallbackActive = true;

      const tick = () => {
        if (isDisposed || !fallbackActive) return;

        void refresh();
        if (fallbackActive) {
          fallbackTimer = window.setTimeout(tick, REALTIME_FALLBACK_POLL_MS);
        }
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
    brief: data?.brief ?? null,
    summary: data?.summary ?? null,
    analytics: data?.analytics ?? null,
    alerts: data?.alerts ?? [],
    isLoading,
    error,
    refresh,
  };
};
