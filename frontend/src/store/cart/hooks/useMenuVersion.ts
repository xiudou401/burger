import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMenuVersion } from '../../../api/menu-version';
import { connectMenuRealtime } from '../../../api/realtime';

const MENU_POLL_MS = 30_000;

export const useMenuVersion = () => {
  const [menuVersion, setMenuVersion] = useState<number | null>(null);
  const fallbackTimerRef = useRef<number | undefined>(undefined);
  const fallbackControllerRef = useRef<AbortController | null>(null);
  const fallbackActiveRef = useRef(false);

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
    let cancelled = false;

    const clearFallbackPolling = () => {
      fallbackActiveRef.current = false;

      if (fallbackTimerRef.current !== undefined) {
        window.clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = undefined;
      }

      fallbackControllerRef.current?.abort();
      fallbackControllerRef.current = null;
    };

    const startFallbackPolling = () => {
      if (cancelled || fallbackActiveRef.current) return;

      fallbackActiveRef.current = true;

      const tick = async () => {
        if (cancelled || !fallbackActiveRef.current) return;

        const currentController = new AbortController();
        fallbackControllerRef.current = currentController;

        try {
          await refreshMenuVersion(currentController.signal);
        } catch {
          // Ignore fallback polling failures; the next tick will retry.
        } finally {
          if (fallbackControllerRef.current === currentController) {
            fallbackControllerRef.current = null;
          }

          if (!cancelled && fallbackActiveRef.current) {
            fallbackTimerRef.current = window.setTimeout(tick, MENU_POLL_MS);
          }
        }
      };

      void tick();
    };

    void refreshMenuVersion();

    const socket = connectMenuRealtime({
      onMenuUpdated: ({ menuVersion: nextVersion }) => {
        setMenuVersion((prev) =>
          prev === null || nextVersion > prev ? nextVersion : prev,
        );
      },
      onConnected: () => {
        clearFallbackPolling();
        void refreshMenuVersion();
      },
      onDisconnected: startFallbackPolling,
    });

    return () => {
      cancelled = true;
      clearFallbackPolling();
      socket.disconnect();
    };
  }, [refreshMenuVersion]);

  return {
    menuVersion,
    refreshMenuVersion,
  };
};
