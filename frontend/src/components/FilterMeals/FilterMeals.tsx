import { useState } from 'react';
import classes from './FilterMeals.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
interface Props {
  onSearch: (keyword: string) => void;
}

const FilterMeals = ({ onSearch }: Props) => {
  const [value, setValue] = useState('');

  return (
    <div className={classes.FilterMeals}>
      <div className={classes.InputOuter}>
        <input
          className={classes.SearchInput}
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            onSearch(next);
          }}
          placeholder="搜索菜品"
        />

        <span className={classes.SearchButton} aria-hidden="true">
          <FontAwesomeIcon icon={faSearch} />
        </span>
      </div>
    </div>
  );
};

export default FilterMeals;
