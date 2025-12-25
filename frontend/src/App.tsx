import { useEffect, useState } from 'react';
import MealsList from './components/Meals/MealsList';
import Cart from './components/Cart/Cart';
import FilterMeals from './components/FilterMeals/FilterMeals';
import { Meal } from './types/meal';
import { CartProvider } from './store/cart/CartProvider';
import { useCartContext } from './hooks/useCartContext';

const App = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);

  const { items, totalPrice, totalQuantity } = useCartContext();

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
    localStorage.setItem(
      'CartState',
      JSON.stringify({ items, totalPrice, totalQuantity })
    );
  }, [items, totalPrice, totalQuantity]);

  const onSearch = (keyword: string) => {
    if (!allMeals.length) return;
    setMeals(allMeals.filter((meal) => meal.name.includes(keyword.trim())));
  };
  return (
    <CartProvider>
      <div className="App">
        <FilterMeals onSearch={onSearch} />
        <MealsList meals={meals} />
        <Cart />
      </div>
    </CartProvider>
  );
};

export default App;
