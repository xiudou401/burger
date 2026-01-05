import { useState } from 'react';
import classes from './FilterMeals.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
interface Props {
  onSearch: (keyword: string) => void;
}

const FilterMeals = ({ onSearch }: Props) => {
  const [value, setValue] = useState('');

  const submitHandler = () => {
    onSearch(value.trim());
  };

  return (
    <div className={classes.FilterMeals}>
      <div className={classes.InputOuter}>
        <input
          className={classes.SearchInput}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="搜索菜品"
        />

        <button
          className={classes.SearchButton}
          onClick={submitHandler}
          type="button"
        >
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </div>
    </div>
  );
};

export default FilterMeals;
