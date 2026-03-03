import { CART_ACTIONS } from '../types/cart';
import { useCartContext } from './useCart';

export const useCartActions = () => {
  const { cartDispatch } = useCartContext();

  const addItem = (id: string) => {
    cartDispatch({ type: CART_ACTIONS.ADD_ITEM, id });
  };

  const removeItem = (id: string) => {
    cartDispatch({ type: CART_ACTIONS.REMOVE_ITEM, id });
  };

  const deleteItem = (id: string) => {
    cartDispatch({ type: CART_ACTIONS.DELETE_ITEM, id });
  };

  const clearCart = () => {
    cartDispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  return { addItem, removeItem, deleteItem, clearCart };
};
