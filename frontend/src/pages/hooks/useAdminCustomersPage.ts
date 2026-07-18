import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [busyCustomerId, setBusyCustomerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const loadRequestIdRef = useRef(0);
  const loadControllerRef = useRef<AbortController | null>(null);

  const loadCustomers = useCallback(
    async ({
      pageToLoad = 1,
      append = false,
    }: {
      pageToLoad?: number;
      append?: boolean;
    } = {}) => {
      loadControllerRef.current?.abort();

      const controller = new AbortController();
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;
      loadControllerRef.current = controller;

      if (append) {
        setIsLoading(false);
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setIsLoadingMore(false);
      }

      setError(null);

      try {
        const res = await fetchAdminCustomers({
          page: pageToLoad,
          limit: PAGE_LIMIT,
          search,
          signal: controller.signal,
        });

        if (requestId !== loadRequestIdRef.current) return;

        setCustomers((current) =>
          append ? [...current, ...res.customers] : res.customers,
        );
        setPage(res.page);
        setTotalPages(Math.max(res.totalPages, 1));
      } catch (err) {
        if (requestId !== loadRequestIdRef.current) return;

        setError(
          err instanceof Error ? err.message : 'Could not load customers',
        );
      } finally {
        if (loadControllerRef.current === controller) {
          loadControllerRef.current = null;
        }

        if (requestId !== loadRequestIdRef.current) return;

        if (append) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [search],
  );

  useEffect(() => {
    void loadCustomers();

    return () => {
      loadRequestIdRef.current += 1;
      loadControllerRef.current?.abort();
      loadControllerRef.current = null;
    };
  }, [loadCustomers]);

  const refresh = () => {
    void loadCustomers();
  };

  const loadMore = () => {
    if (page >= totalPages || isLoadingMore) return;

    void loadCustomers({ pageToLoad: page + 1, append: true });
  };

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
    isLoadingMore,
    hasMoreCustomers: page < totalPages,
    busyCustomerId,
    error,
    message,
    disableCustomer,
    enableCustomer,
    refresh,
    loadMore,
  };
};
