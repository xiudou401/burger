import { useEffect, useRef, useState } from 'react';
import { fetchMenuVersion } from '../../api/menu-version';

const MENU_VERSION_POLL_MS = 30_000;

export const useMenuRefreshPrompt = () => {
  const [hasMenuUpdate, setHasMenuUpdate] = useState(false);
  const baselineVersionRef = useRef<number | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    let controller: AbortController | null = null;

    const tick = async () => {
      controller = new AbortController();

      try {
        const nextVersion = await fetchMenuVersion(controller.signal);

        if (cancelled) return;

        if (baselineVersionRef.current === null) {
          baselineVersionRef.current = nextVersion;
        } else if (nextVersion !== baselineVersionRef.current) {
          setHasMenuUpdate(true);
        }
      } catch {
        // Ignore polling failures; the next tick will retry.
      } finally {
        controller = null;

        if (!cancelled) {
          timer = window.setTimeout(tick, MENU_VERSION_POLL_MS);
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
  }, []);

  const acknowledgeMenuUpdate = async () => {
    setHasMenuUpdate(false);

    try {
      baselineVersionRef.current = await fetchMenuVersion();
    } catch {
      baselineVersionRef.current = null;
    }
  };

  return {
    hasMenuUpdate,
    acknowledgeMenuUpdate,
  };
};
