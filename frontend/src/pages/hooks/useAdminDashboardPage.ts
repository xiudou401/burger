import { useCallback } from 'react';
import { fetchAdminDashboardSummary } from '../../api/admin-dashboard';
import type { AdminDashboardSummary } from '../../types/admin-dashboard';
import { useAdminResource } from './useAdminResource';

export const useAdminDashboardPage = () => {
  const loadSummary = useCallback(async (signal: AbortSignal) => {
    const res = await fetchAdminDashboardSummary(signal);
    return res.summary;
  }, []);

  const {
    data: summary,
    isLoading,
    error,
    refresh,
  } = useAdminResource<AdminDashboardSummary | null>({
    initialData: null,
    load: loadSummary,
    errorMessage: 'Could not load dashboard',
  });

  return {
    summary,
    isLoading,
    error,
    refresh,
  };
};
