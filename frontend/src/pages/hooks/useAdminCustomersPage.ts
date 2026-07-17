import { useEffect, useState } from 'react';
import {
  disableAdminCustomer,
  enableAdminCustomer,
  fetchAdminCustomers,
} from '../../api/admin-customers';
import type { AdminCustomer } from '../../types/admin-customer';

const PAGE_LIMIT = 20;

export const useAdminCustomersPage = () => {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [busyCustomerId, setBusyCustomerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadCustomers = async (pageToLoad = page) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchAdminCustomers({
        page: pageToLoad,
        limit: PAGE_LIMIT,
        search,
      });
      setCustomers(res.customers);
      setPage(res.page);
      setTotalPages(Math.max(res.totalPages, 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers(1);
    // Search is intentionally the query dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const replaceCustomer = (customer: AdminCustomer) => {
    setCustomers((current) =>
      current.map((item) => (item.id === customer.id ? customer : item)),
    );
  };

  const disableCustomer = async (customer: AdminCustomer, reason: string) => {
    setBusyCustomerId(customer.id);
    setError(null);
    setMessage(null);

    try {
      const res = await disableAdminCustomer(customer.id, reason);
      replaceCustomer(res.customer);
      setMessage(`${res.customer.email ?? res.customer.name} disabled`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disable user');
    } finally {
      setBusyCustomerId(null);
    }
  };

  const enableCustomer = async (customer: AdminCustomer) => {
    setBusyCustomerId(customer.id);
    setError(null);
    setMessage(null);

    try {
      const res = await enableAdminCustomer(customer.id);
      replaceCustomer(res.customer);
      setMessage(`${res.customer.email ?? res.customer.name} enabled`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable user');
    } finally {
      setBusyCustomerId(null);
    }
  };

  return {
    customers,
    search,
    setSearch,
    page,
    totalPages,
    isLoading,
    busyCustomerId,
    error,
    message,
    disableCustomer,
    enableCustomer,
    refresh: () => loadCustomers(page),
    nextPage: () => loadCustomers(Math.min(page + 1, totalPages)),
    previousPage: () => loadCustomers(Math.max(page - 1, 1)),
  };
};
