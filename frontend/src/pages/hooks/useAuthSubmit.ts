import { useRef, useState } from 'react';

export const useAuthSubmit = (fallbackMessage: string) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const runSubmit = async (submitter: () => Promise<void>) => {
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setError(null);
    setIsSubmitting(true);

    try {
      await submitter();
    } catch (err) {
      const message = err instanceof Error ? err.message : fallbackMessage;
      setError(message);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    error,
    setError,
    isSubmitting,
    runSubmit,
  };
};
