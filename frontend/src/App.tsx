import { useEffect, useState } from 'react';
import MealsList from './components/Meals/MealsList';
import Cart from './components/Cart/Cart';
import FilterMeals from './components/FilterMeals/FilterMeals';
import { Meal } from './types/meal';

const App = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const response = await fetch('api/meals');
        const data = await response.json();
        const INITIAL_MEALS: Meal[] = data.items;
        setMeals(INITIAL_MEALS);
        setAllMeals(INITIAL_MEALS);
        console.log(meals);
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
    <div className="App">
      <FilterMeals onSearch={onSearch} />
      <MealsList meals={meals} />
      <Cart />
    </div>
  );
};

export default App;
