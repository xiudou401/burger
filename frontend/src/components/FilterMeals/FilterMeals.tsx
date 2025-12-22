import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import classes from './FilterMeals.module.css';

interface FilterMealsProps {
  onSearch: (keyword: string) => void;
}

const FilterMeals = ({ onSearch }: FilterMealsProps) => {
  const [keyword, setKeyword] = useState('');
  const changHandler = (e: ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value.trim());
  };

  const timer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    timer.current = setTimeout(() => {
      onSearch(keyword);
    }, 300);
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [keyword]);
  return (
    <div className={classes.FilterMeals}>
      <div className={classes.InputOuter}>
        <input
          type="text"
          className={classes.SearchInput}
          placeholder="Key in..."
          onChange={changHandler}
          value={keyword}
        />
      </div>
    </div>
  );
};

export default FilterMeals;
