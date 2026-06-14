import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMenuVersion } from '../../../api/menu-version';

const MENU_POLL_MS = 30_000;

export const useMenuVersion = () => {
  const [menuVersion, setMenuVersion] = useState<number | null>(null);
  const requestIdRef = useRef(0);

  const refreshMenuVersion = useCallback(async (signal?: AbortSignal) => {
    const requestId = ++requestIdRef.current;
    const version = await fetchMenuVersion(signal);

    if (!signal?.aborted && requestId === requestIdRef.current) {
      setMenuVersion((prev) => (prev === version ? prev : version));
    }

    return version;
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    let controller: AbortController | null = null;

    const tick = async () => {
      if (cancelled) return;

      const currentController = new AbortController();
      controller = currentController;

      try {
        await refreshMenuVersion(currentController.signal);
      } catch {
        // Ignore polling failures; the next tick will retry.
      } finally {
        if (controller === currentController) {
          controller = null;
        }

        if (!cancelled) {
          timer = window.setTimeout(tick, MENU_POLL_MS);
        }
      }
    };

    tick();

    return () => {
      cancelled = true;
      controller?.abort();

      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [refreshMenuVersion]);

  return {
    menuVersion,
    refreshMenuVersion,
  };
};
