interface CheckoutAttemptKeyOptions {
  randomUUID?: () => string;
  random?: () => number;
}

export const createCheckoutAttemptKey = ({
  randomUUID = window.crypto?.randomUUID?.bind(window.crypto),
  random = Math.random,
}: CheckoutAttemptKeyOptions = {}) => {
  if (randomUUID) {
    return randomUUID();
  }

  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (char) =>
    (Number(char) ^ ((random() * 16) >> (Number(char) / 4))).toString(16),
  );
};
