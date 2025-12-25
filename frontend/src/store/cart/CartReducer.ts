import {
  CART_ACTIONS,
  CartAction,
  CartMeal,
  CartState,
} from '../../types/cart';
import { addItem, deleteItem, removeItem } from './cart.logic';
import { updateTotals } from './cart.utils';

export const initialCartState: CartState = {
  items: [],
  totalQuantity: 0,
  totalPrice: 0,
};

export const getInitialCartState = (): CartState => {
  const stored = localStorage.getItem('CartState');
  if (!stored) return initialCartState;

  try {
    return JSON.parse(stored) as CartState;
  } catch {
    return initialCartState;
  }
};

export const CartReducer = (state: CartState, action: CartAction) => {
  let updatedCartItems: CartMeal[];

  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM:
    case CART_ACTIONS.REMOVE_ITEM:
    case CART_ACTIONS.DELETE_ITEM: {
      if (action.type === CART_ACTIONS.ADD_ITEM) {
        updatedCartItems = addItem(state.items, action.meal);
      } else if (action.type === CART_ACTIONS.REMOVE_ITEM) {
        updatedCartItems = removeItem(state.items, action._id);
      } else {
        updatedCartItems = deleteItem(state.items, action._id);
      }
      const { totalQuantity, totalPrice } = updateTotals(updatedCartItems);
      return { items: updatedCartItems, totalQuantity, totalPrice };
    }

    case CART_ACTIONS.CLEAR_CART:
      return initialCartState;
    default:
      return state;
  }
};
