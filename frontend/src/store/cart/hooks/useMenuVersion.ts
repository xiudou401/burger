import { useCallback, useEffect, useState } from 'react';
import { fetchMenuVersion } from '../../../api/menu-version';

const MENU_POLL_MS = 30_000;

export const useMenuVersion = () => {
  const [menuVersion, setMenuVersion] = useState<number | null>(null);

  const refreshMenuVersion = useCallback(async (signal?: AbortSignal) => {
    const version = await fetchMenuVersion(signal);

    if (!signal?.aborted) {
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

      controller = new AbortController();

      try {
        await refreshMenuVersion(controller.signal);
      } catch {
        // Ignore polling failures; the next tick will retry.
      } finally {
        controller = null;

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
