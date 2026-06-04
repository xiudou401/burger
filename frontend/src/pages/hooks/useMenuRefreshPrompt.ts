import { useEffect, useRef, useState } from 'react';

export const useMenuRefreshPrompt = (menuVersion: number) => {
  const [hasMenuUpdate, setHasMenuUpdate] = useState(false);
  const baselineVersionRef = useRef<number | null>(null);

  useEffect(() => {
    if (menuVersion === 0) return;

    if (baselineVersionRef.current === null) {
      baselineVersionRef.current = menuVersion;
    } else if (menuVersion !== baselineVersionRef.current) {
      setHasMenuUpdate(true);
    }
  }, [menuVersion]);

  const acknowledgeMenuUpdate = () => {
    setHasMenuUpdate(false);
    baselineVersionRef.current = menuVersion === 0 ? null : menuVersion;
  };

  return {
    hasMenuUpdate,
    acknowledgeMenuUpdate,
  };
};
