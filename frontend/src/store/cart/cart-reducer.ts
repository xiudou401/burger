import {
  CartState,
  CartStoredItem,
  CartAction,
  CART_ACTIONS,
} from '../../types/cart';
import { addItem, removeItem, deleteItem } from './cart-logic';

export const initialCartState: CartState = {
  items: [],
  totalQuantity: 0,
};

export const loadCartState = (): CartState => {
  const stored = localStorage.getItem('CartItemsState');
  if (!stored) return initialCartState;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return initialCartState;

    const items: CartStoredItem[] = parsed
      .filter(
        (x: any) =>
          x &&
          typeof x.id === 'string' &&
          typeof x.quantity === 'number' &&
          x.quantity > 0,
      )
      .map((x: any) => ({ id: x.id, quantity: Math.floor(x.quantity) }));

    const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
    return { items, totalQuantity };
  } catch {
    return initialCartState;
  }
};

export const CartReducer = (
  state: CartState,
  action: CartAction,
): CartState => {
  let updatedItems: CartStoredItem[];

  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM:
      updatedItems = addItem(state.items, action.id);
      break;
    case CART_ACTIONS.REMOVE_ITEM:
      updatedItems = removeItem(state.items, action.id);
      break;
    case CART_ACTIONS.DELETE_ITEM:
      updatedItems = deleteItem(state.items, action.id);
      break;
    case CART_ACTIONS.CLEAR_CART:
      return initialCartState;
    default:
      return state;
  }

  const totalQuantity = updatedItems.reduce((sum, i) => sum + i.quantity, 0);

  return { items: updatedItems, totalQuantity };
};
