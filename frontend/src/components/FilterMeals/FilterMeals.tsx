import { useState } from 'react';

interface Props {
  onSearch: (keyword: string) => void;
}

const FilterMeals = ({ onSearch }: Props) => {
  const [value, setValue] = useState('');

  const submitHandler = () => {
    onSearch(value.trim());
  };

  return (
    <div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="搜索菜品"
      />
      <button onClick={submitHandler}>搜索</button>
    </div>
  );
};

export default FilterMeals;
