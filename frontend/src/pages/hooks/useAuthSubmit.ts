import { useState } from 'react';

export const useAuthSubmit = (fallbackMessage: string) => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const runSubmit = async (submitter: () => Promise<void>) => {
    setError(null);
    setIsSubmitting(true);

    try {
      await submitter();
    } catch (err) {
      const message = err instanceof Error ? err.message : fallbackMessage;
      setError(message);
    } finally {
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
