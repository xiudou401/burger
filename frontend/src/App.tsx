import { useEffect, useReducer, useState } from 'react';
import MealsList from './components/Meals/MealsList';
import { CART_ACTIONS, CartAction, CartMeal, CartState } from './types/cart';
import { CartContext } from './store/CartContext';
import Cart from './components/Cart/Cart';
import FilterMeals from './components/FilterMeals/FilterMeals';
import { Meal } from './types/meal';

const initialCartState: CartState = {
  items: [],
  totalQuantity: 0,
  totalPrice: 0,
};

const getInitialCartState = (): CartState => {
  const stored = localStorage.getItem('CartState');
  if (!stored) return initialCartState;

  try {
    return JSON.parse(stored) as CartState;
  } catch {
    return initialCartState;
  }
};

const CartReducer = (state: CartState, action: CartAction) => {
  let updatedCartItems: CartMeal[];
  const updateTotals = (cartMeals: CartMeal[]) => {
    const totalQuantity = cartMeals.reduce(
      (sumQuantity, meal) => sumQuantity + meal.quantity,
      0
    );
    const totalPrice = cartMeals.reduce(
      (sumPrice, meal) => sumPrice + meal.price * meal.quantity,
      0
    );
    return { totalQuantity, totalPrice };
  };

  switch (action.type) {
    case CART_ACTIONS.ADD:
    case CART_ACTIONS.REMOVE: {
      if (action.type === CART_ACTIONS.ADD) {
        const existing = state.items.find(
          (item) => item._id === action.meal._id
        );
        if (existing) {
          updatedCartItems = state.items.map((item) =>
            item._id === action.meal._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          updatedCartItems = [...state.items, { ...action.meal, quantity: 1 }];
        }
      } else {
        updatedCartItems = state.items
          .map((item) =>
            item._id === action.meal._id
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
          .filter((item) => item.quantity > 0);
      }
      const { totalQuantity, totalPrice } = updateTotals(updatedCartItems);

      return { items: updatedCartItems, totalQuantity, totalPrice };
    }
    case CART_ACTIONS.CLEAR:
      return initialCartState;
    default:
      return state;
  }
};

const App = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [state, cartDispatch] = useReducer(
    CartReducer,
    initialCartState,
    getInitialCartState
  );

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const response = await fetch('api/meals');
        const INITIAL_MEALS: Meal[] = await response.json();
        setMeals(INITIAL_MEALS);
        setAllMeals(INITIAL_MEALS);
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    };
    fetchMeals();
  }, []);

  useEffect(() => {
    localStorage.setItem('CartState', JSON.stringify(state));
  }, [state]);

  const onSearch = (keyword: string) => {
    if (!allMeals.length) return;
    setMeals(allMeals.filter((meal) => meal.name.includes(keyword.trim())));
  };
  return (
    <CartContext.Provider value={{ ...state, cartDispatch }}>
      <div className="App">
        <FilterMeals onSearch={onSearch} />
        <MealsList meals={meals} />
        <Cart />
      </div>
    </CartContext.Provider>
  );
};

export default App;
