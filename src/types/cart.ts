export interface Meal {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
}

export interface CartMeal extends Meal {
  quantity: number;
}

export interface CartState {
  items: CartMeal[];
  totalQuantity: number;
  totalPrice: number;
}

export const CART_ACTIONS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  CLEAR: 'CLEAR',
};

export type CartAction = { type: typeof CART_ACTIONS.ADD; meal: Meal };
