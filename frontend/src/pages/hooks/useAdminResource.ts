import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface UseAdminResourceParams<TData> {
  initialData: TData;
  load: (signal: AbortSignal) => Promise<TData>;
  errorMessage: string;
}

interface UseAdminResourceResult<TData> {
  data: TData;
  setData: Dispatch<SetStateAction<TData>>;
  isLoading: boolean;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  refresh: () => Promise<TData | null>;
}

export const useAdminResource = <TData>({
  initialData,
  load,
  errorMessage,
}: UseAdminResourceParams<TData>): UseAdminResourceResult<TData> => {
  const [data, setData] = useState<TData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    controllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const nextData = await load(controller.signal);

      if (requestId !== requestIdRef.current) return null;

      setData(nextData);
      return nextData;
    } catch (err) {
      if (requestId !== requestIdRef.current) return null;

      setError(err instanceof Error ? err.message : errorMessage);
      return null;
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }

      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [errorMessage, load]);

  useEffect(() => {
    void refresh();

    return () => {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [refresh]);

  return {
    data,
    setData,
    isLoading,
    error,
    setError,
    refresh,
  };
};
