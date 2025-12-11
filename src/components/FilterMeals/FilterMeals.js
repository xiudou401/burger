import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classes from './FilterMeals.module.css';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';

const FilterMeals = ({ onSearch }) => {
  const [keyword, setKeyword] = useState('');
  const changeHandler = (e) => {
    setKeyword(e.target.value);
  };

  let timer = useRef(null);

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
          onChange={changeHandler}
          value={keyword}
        />
        <FontAwesomeIcon className={classes.SearchIcon} icon={faSearch} />
      </div>
    </div>
  );
};

export default FilterMeals;
