import { useState } from 'react';
import classes from './MenuSearch.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faXmark } from '@fortawesome/free-solid-svg-icons';

interface Props {
  value?: string;
  onSearch: (keyword: string) => void;
  placeholder?: string;
  variant?: 'default' | 'compact';
}

const MenuSearch = ({
  value: controlledValue,
  onSearch,
  placeholder = 'Search the Sydney menu',
  variant = 'default',
}: Props) => {
  const [uncontrolledValue, setUncontrolledValue] = useState('');
  const value = controlledValue ?? uncontrolledValue;
  const menuSearchClass =
    variant === 'compact'
      ? `${classes.MenuSearch} ${classes.Compact}`
      : classes.MenuSearch;

  const updateValue = (nextValue: string) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(nextValue);
    }

    onSearch(nextValue);
  };

  const clearHandler = () => {
    updateValue('');
  };

  return (
    <div className={menuSearchClass}>
      <div className={classes.InputOuter}>
        <span className={classes.SearchIcon} aria-hidden="true">
          <FontAwesomeIcon icon={faSearch} />
        </span>

        <input
          className={classes.SearchInput}
          value={value}
          onChange={(e) => {
            updateValue(e.target.value);
          }}
          placeholder={placeholder}
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
