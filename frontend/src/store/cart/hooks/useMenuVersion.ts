import { useEffect, useState } from 'react';
import { fetchMenuVersion } from '../../../api/menu-version';

const MENU_POLL_MS = 30_000;

export const useMenuVersion = () => {
  const [menuVersion, setMenuVersion] = useState(0);

  useEffect(() => {
    let timer: number | undefined;

    const tick = async () => {
      try {
        const version = await fetchMenuVersion();
        setMenuVersion((prev) => (prev === version ? prev : version));
      } catch {
        // Ignore polling failures; the next tick will retry.
      } finally {
        timer = window.setTimeout(tick, MENU_POLL_MS);
      }
    };

    tick();

    return () => {
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
