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

const CartReducer = (state: CartState, action: CartAction) => {
  let updatedCartItems = [...state.items];
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
      const existingMealIndex = updatedCartItems.findIndex(
        (item) => item._id === action.meal._id
      );
      if (action.type === CART_ACTIONS.ADD) {
        if (existingMealIndex === -1) {
          updatedCartItems = [
            ...updatedCartItems,
            { ...action.meal, quantity: 1 },
          ];
        } else {
          updatedCartItems[existingMealIndex] = {
            ...updatedCartItems[existingMealIndex],
            quantity: updatedCartItems[existingMealIndex].quantity + 1,
          };
        }
      } else {
        if (existingMealIndex === -1) {
          return state;
        }
        if (updatedCartItems[existingMealIndex].quantity > 1) {
          updatedCartItems[existingMealIndex] = {
            ...updatedCartItems[existingMealIndex],
            quantity: updatedCartItems[existingMealIndex].quantity - 1,
          };
        } else {
          updatedCartItems = updatedCartItems.filter(
            (item) => item._id !== action.meal._id
          );
        }
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
  const [state, cartDispatch] = useReducer(CartReducer, initialCartState);

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
