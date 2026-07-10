import { useEffect, useState } from 'react';
import { fetchAdminDashboardSummary } from '../../api/admin-dashboard';
import type { AdminDashboardSummary } from '../../types/admin-dashboard';

export const useAdminDashboardPage = () => {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchAdminDashboardSummary();
      setSummary(res.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return {
    summary,
    isLoading,
    error,
    refresh: loadSummary,
  };
};
