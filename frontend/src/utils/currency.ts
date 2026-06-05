export const formatCurrency = (cents: number) => {
  return `A$${(cents / 100).toFixed(2)}`;
};
