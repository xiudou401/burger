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

  const loadMeals = async ({
    page,
    keyword,
  }: {
    page: number;
    keyword?: string;
  }) => {
    try {
      setIsLoading(true);

      const data = await fetchMeals({
        page,
        keyword,
        limit: 4,
      });

      setMeals(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeals({ page: 1 });
  }, []);

  const onSearch = (value: string) => {
    const k = value.trim();
    setKeyword(k);
    loadMeals({ page: 1, keyword: k || undefined });
  };

  const onPageChange = (newPage: number) => {
    loadMeals({ page: newPage, keyword: keyword || undefined });
  };

  return (
    <div className="App">
      <FilterMeals onSearch={onSearch} />
      {isLoading ? <p>加载中...</p> : <MealsList meals={meals} />}
      <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      <Cart />
    </div>
  );
};

export default App;
