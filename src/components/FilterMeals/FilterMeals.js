import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classes from './FilterMeals.module.css';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const FilterMeals = ({ onFilter }) => {
  const inputChangeHandler = (e) => {
    const keyword = e.target.value.trim();
    onFilter(keyword);
  };
  return (
    <div className={classes.FilterMeals}>
      <div className={classes.InputOuter}>
        <input
          type="text"
          placeholder="type in..."
          className={classes.SearchInput}
          onChange={inputChangeHandler}
        />
        <FontAwesomeIcon className={classes.SearchIcon} icon={faSearch} />
      </div>
    </div>
  );
};

export default FilterMeals;
