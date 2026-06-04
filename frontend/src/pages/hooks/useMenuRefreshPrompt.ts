import { useEffect, useRef, useState } from 'react';

export const useMenuRefreshPrompt = (menuVersion: number | null) => {
  const [hasMenuUpdate, setHasMenuUpdate] = useState(false);
  const baselineVersionRef = useRef<number | null>(null);

  useEffect(() => {
    if (menuVersion === null) return;

    if (baselineVersionRef.current === null) {
      baselineVersionRef.current = menuVersion;
      return;
    } else if (menuVersion !== baselineVersionRef.current) {
      setHasMenuUpdate(true);
    }
  }, [menuVersion]);

  const acknowledgeMenuUpdate = () => {
    setHasMenuUpdate(false);
    baselineVersionRef.current = menuVersion;
  };

  return {
    hasMenuUpdate,
    acknowledgeMenuUpdate,
  };
};
