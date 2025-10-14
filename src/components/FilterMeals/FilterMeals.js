import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classes from './FilterMeals.module.css';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';

const FilterMeals = ({ filterMeals }) => {
  const [keyword, setKeyword] = useState('');
  const isComposing = useRef(false);
  const timer = useRef(null);
  const handleChange = (e) => {
    const value = e.target.value.trim();
    setKeyword(value);
  };

  useEffect(() => {
    timer.current = setTimeout(() => {
      filterMeals(keyword);
    }, 300);
    return () => {
      if (isComposing.current) return;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [keyword, filterMeals]);

  return (
    <div className={classes.FilterMeals}>
      <div className={classes.InputOuter}>
        <input
          type="text"
          className={classes.SearchInput}
          placeholder="Key in..."
          onChange={handleChange}
          onCompositionStart={() => {
            isComposing.current = true;
          }}
          onCompositionEnd={(e) => {
            isComposing.current = false;
            filterMeals(e.target.value);
          }}
          value={keyword}
        />
        <FontAwesomeIcon className={classes.SearchIcon} icon={faSearch} />
      </div>
    </div>
  );
};

export default FilterMeals;
