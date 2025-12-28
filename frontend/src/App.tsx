import { useEffect, useState } from 'react';
import MealsList from './components/Meals/MealsList';
import Cart from './components/Cart/Cart';
import FilterMeals from './components/FilterMeals/FilterMeals';
import { Meal } from './types/meal';
import { fetchMeals } from './api/meals';
import Pagination from './components/Pagination/Pagination';

const App = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadMeals = async (options?: { page?: number; keyword?: string }) => {
    try {
      setIsLoading(true);

      const data = await fetchMeals({
        page: options?.page ?? page,
        keyword: options?.keyword ?? keyword,
        limit: 2,
      });

      setMeals(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeals({ page: 1 });
  }, []);

  // useEffect(() => {
  //   const fetchMeals = async () => {
  //     try {
  //       const response = await fetch('api/meals');
  //       const data = await response.json();
  //       const INITIAL_MEALS: Meal[] = data.items;
  //       setMeals(INITIAL_MEALS);
  //       setAllMeals(INITIAL_MEALS);
  //       console.log(meals);
  //     } catch (error) {
  //       console.error('加载数据失败:', error);
  //     }
  //   };
  //   fetchMeals();
  // }, []);

  const onSearch = (keyword: string) => {
    setKeyword(keyword);
    loadMeals({ keyword, page: 1 });
  };

  const onPageChange = (newPage: number) => {
    loadMeals({ page: newPage });
  };

  return (
    <div className="App">
      <FilterMeals onSearch={onSearch} />
      {isLoading ? <p>加载中...</p> : <MealsList meals={meals} />}

      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      {/* 
      <MealsList meals={meals} /> */}
      <Cart />
    </div>
  );
};

export default App;
