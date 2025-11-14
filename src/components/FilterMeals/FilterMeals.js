import { faSearch } from '@fortawesome/free-solid-svg-icons';
import classes from './FilterMeals.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';

const FilterMeals = ({ filterMealsHandler }) => {
  const [keyword, setKeyword] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const timer = useRef(null);

  const changeHandler = (e) => {
    setKeyword(e.target.value);
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e) => {
    setIsComposing(false);
    setKeyword(e.target.value); // 最终汉字
  };

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
  }, [keyword]);

  return (
    <div className={classes.FilterMeals}>
      <div className={classes.InputOuter}>
        <input
          type="text"
          className={classes.SearchInput}
          placeholder="Key in..."
          onChange={changeHandler}
          value={keyword}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
        />
        <FontAwesomeIcon className={classes.SearchIcon} icon={faSearch} />
      </div>
    </div>
  );
};

export default FilterMeals;
