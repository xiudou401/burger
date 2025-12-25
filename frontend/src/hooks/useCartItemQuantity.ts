import { useCartContext } from './useCart';

export const useCartItemQuantity = (_id: string) => {
  const { items } = useCartContext();
  return items.find((item) => item._id === _id)?.quantity ?? 0;
};
