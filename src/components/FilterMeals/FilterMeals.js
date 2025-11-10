import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classes from './FilterMeals.module.css';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';

const FilterMeals = ({ filterMealsHandler }) => {
  const [keyword, setKeyword] = useState('');

  return (
    <div className={classes.FilterMeals}>
      <div className={classes.InputOuter}>
        <input
          type="text"
          className={classes.SearchInput}
          placeholder="Key in..."
        />
        <FontAwesomeIcon icon={faSearch} className={classes.SearchIcon} />
      </div>
    </div>
  );
};

export default FilterMeals;
