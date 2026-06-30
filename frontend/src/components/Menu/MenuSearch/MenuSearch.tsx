import { useState } from 'react';
import classes from './MenuSearch.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faXmark } from '@fortawesome/free-solid-svg-icons';

interface Props {
  onSearch: (keyword: string) => void;
}

const MenuSearch = ({ onSearch }: Props) => {
  const [value, setValue] = useState('');

  const clearHandler = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className={classes.MenuSearch}>
      <div className={classes.InputOuter}>
        <span className={classes.SearchIcon} aria-hidden="true">
          <FontAwesomeIcon icon={faSearch} />
        </span>

        <input
          className={classes.SearchInput}
          value={value}
          onChange={(e) => {
            const next = e.target.value;
            setValue(next);
            onSearch(next);
          }}
          placeholder="Search the Sydney menu"
        />

        {value && (
          <button
            type="button"
            onClick={clearHandler}
            className={classes.ClearButton}
            aria-label="Clear search"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuSearch;
