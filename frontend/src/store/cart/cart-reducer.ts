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

const CART_STORAGE_KEY = 'CartItemsState';

const calculateTotalQuantity = (items: CartStoredItem[]) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

const createCartState = (items: CartStoredItem[]): CartState => ({
  items,
  totalQuantity: calculateTotalQuantity(items),
});

const isStoredCartItem = (value: unknown): value is CartStoredItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === 'string' &&
    typeof item.quantity === 'number' &&
    Number.isFinite(item.quantity) &&
    item.quantity > 0
  );
};

const isSuccessfulPaymentReturn = () => {
  if (typeof window === 'undefined') return false;

  const searchParams = new URLSearchParams(window.location.search);
  const payment = searchParams.get('payment');

  return (
    payment === 'success' &&
    ['/profile', '/payment/return'].includes(window.location.pathname)
  );
};

export const clearPersistedCart = () => {
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(initialCartState.items),
  );
};

export const loadCartState = (): CartState => {
  if (isSuccessfulPaymentReturn()) {
    clearPersistedCart();
    return initialCartState;
  }

  const stored = localStorage.getItem(CART_STORAGE_KEY);
  if (!stored) return initialCartState;

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return initialCartState;

    const items: CartStoredItem[] = parsed
      .filter(isStoredCartItem)
      .map(({ id, quantity }) => ({ id, quantity: Math.floor(quantity) }));

    return createCartState(items);
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

  return createCartState(updatedItems);
};
