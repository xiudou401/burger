import { faSearch } from '@fortawesome/free-solid-svg-icons';
import classes from './FilterMeals.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';

const FilterMeals = ({ filterMealsHandler }) => {
  const [keyword, setKeyword] = useState('');
  const changeHandler = (e) => {
    setKeyword(e.target.value);
  };

  const timer = useRef(null);

  useEffect(() => {
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
        />
        <FontAwesomeIcon className={classes.SearchIcon} icon={faSearch} />
      </div>
    </div>
  );
};

export default FilterMeals;
