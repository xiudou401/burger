import { useEffect, useRef, useState } from 'react';
import classes from './FilterMeals.module.css';

const FilterMeals = ({ filterMealsHandler }) => {
  const [keyword, setKeyword] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const handleChange = (e) => {
    setKeyword(e.target.value);
  };

  const compositionStartHandler = () => {
    setIsComposing(true);
  };
  const compositionEndHandler = (e) => {
    setIsComposing(false);
    setKeyword(e.target.value);
  };

  const timer = useRef(null);

  useEffect(() => {
    if (isComposing) return;
    timer.current = setTimeout(() => {
      filterMealsHandler(keyword);
    }, 300);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [keyword, isComposing]);

  return (
    <div className={classes.FilterMeals}>
      <div className={classes.InputOuter}>
        <input
          type="text"
          className={classes.SearchInput}
          placeholder="Key in..."
          value={keyword}
          onChange={handleChange}
          onCompositionStart={compositionStartHandler}
          onCompositionEnd={compositionEndHandler}
        />
      </div>
    </div>
  );
};

export default FilterMeals;
