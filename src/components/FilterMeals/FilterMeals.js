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
        clearTimeout(timer);
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
        />
        <FontAwesomeIcon icon={faSearch} className={classes.SearchIcon} />
      </div>
    </div>
  );
};

export default FilterMeals;
