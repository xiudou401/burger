import { CART_ACTIONS } from '../types/cart';
import { Meal } from '../types/meal';
import { useCartContext } from './useCart';

export const useCartActions = () => {
  const { cartDispatch } = useCartContext();

  const addItem = (meal: Meal) => {
    cartDispatch({ type: CART_ACTIONS.ADD_ITEM, meal });
  };
  const removeItem = (_id: string) => {
    cartDispatch({ type: CART_ACTIONS.REMOVE_ITEM, _id });
  };
  const deleteItem = (_id: string) => {
    cartDispatch({ type: CART_ACTIONS.DELETE_ITEM, _id });
  };
  const clearCart = () => {
    cartDispatch({ type: CART_ACTIONS.CLEAR_CART });
  };

  return { addItem, removeItem, deleteItem, clearCart };
};
