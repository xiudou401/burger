import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classes from './FilterMeals.module.css';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useRef, useState } from 'react';

const FilterMeals = ({ filterMeals }) => {
  const [keyword, setKeyword] = useState('');
  const isComposing = useRef(false);
  const timer = useRef(null);
  const handleChange = (e) => {
    const value = e.target.value.trim();
    setKeyword(value);
    if (isComposing.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      filterMeals(value);
    }, 300);
  };

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
