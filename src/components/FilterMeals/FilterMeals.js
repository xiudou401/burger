import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classes from './FilterMeals.module.css';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';

const FilterMeals = ({ filterMealsHandler }) => {
  const [keyword, setKeyword] = useState('');
  const timer = useRef(null);

  const handleChange = (e) => {
    setKeyword(e.target.value);
  };

  useEffect(() => {
    timer.current = setTimeout(() => {
      filterMealsHandler(keyword);
    }, 300);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [keyword, filterMealsHandler]);

  return (
    <div className={classes.FilterMeals}>
      <div className={classes.InputOuter}>
        <input
          type="text"
          className={classes.SearchInput}
          placeholder="Key in..."
          onChange={handleChange}
          value={keyword}
        />
        <FontAwesomeIcon className={classes.SearchIcon} icon={faSearch} />
      </div>
    </div>
  );
};

export default FilterMeals;
