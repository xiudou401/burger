import { useCallback, useEffect, useState } from 'react';
import { fetchMenuVersion } from '../../../api/menu-version';
import { connectMenuRealtime } from '../../../api/realtime';

import { createFallbackPolling } from '../../../utils/fallback-polling';

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
    const polling = createFallbackPolling(refreshMenuVersion, {
      immediate: true,
    });

    void refreshMenuVersion();

    const socket = connectMenuRealtime({
      onMenuUpdated: ({ menuVersion: nextVersion }) => {
        setMenuVersion((prev) =>
          prev === null || nextVersion > prev ? nextVersion : prev,
        );
      },
      onConnected: () => {
        polling.stop();
        void refreshMenuVersion();
      },
      onDisconnected: polling.start,
    });

    return () => {
      polling.dispose();
      socket.disconnect();
    };
  }, [refreshMenuVersion]);

  return {
    menuVersion,
    refreshMenuVersion,
  };
};
