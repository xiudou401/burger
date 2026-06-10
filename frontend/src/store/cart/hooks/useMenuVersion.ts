import { useEffect, useState } from 'react';
import { fetchMenuVersion } from '../../../api/menu-version';

const MENU_POLL_MS = 30_000;

export const useMenuVersion = () => {
  const [menuVersion, setMenuVersion] = useState<number | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    let controller: AbortController | null = null;

    const tick = async () => {
      if (cancelled) return;

      controller = new AbortController();

      try {
        const version = await fetchMenuVersion(controller.signal);

        if (!cancelled) {
          setMenuVersion((prev) => (prev === version ? prev : version));
        }
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
  }, []);

  return {
    menuVersion,
    setMenuVersion,
  };
};
