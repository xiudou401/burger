import { useCallback, useEffect, useState } from 'react';
import { fetchMenuVersion } from '../../../api/menu-version';
import { connectMenuRealtime } from '../../../api/realtime';

const MENU_POLL_MS = 30_000;

export const useMenuVersion = () => {
  const [menuVersion, setMenuVersion] = useState<number | null>(null);

  const refreshMenuVersion = useCallback(async (signal?: AbortSignal) => {
    const version = await fetchMenuVersion(signal);

    if (!signal?.aborted) {
      // Backend menu versions are timestamp-based and only move forward.
      setMenuVersion((prev) =>
        prev === null || version > prev ? version : prev,
      );
    }

    return version;
  }, []);

  useEffect(() => {
    const socket = connectMenuRealtime(({ menuVersion: nextVersion }) => {
      setMenuVersion((prev) =>
        prev === null || nextVersion > prev ? nextVersion : prev,
      );
    });

    return () => {
      socket.disconnect();
    };
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
