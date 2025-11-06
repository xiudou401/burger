import { useReducer, useState } from 'react';
import MealsList from './components/Meals/MealsList';
import { CartContext } from './store/CartContext';
import Cart from './components/Cart/Cart';

const INITIAL_MEALS = [
  {
    id: '1',
    name: '汉堡包',
    description:
      '百分百纯牛肉配搭爽脆酸瓜洋葱粒与美味番茄酱经典滋味让你无法抵挡！',
    price: 12,
    image: '/img/meals/1.png',
  },
  {
    id: '2',
    name: '双层吉士汉堡',
    description:
      '百分百纯牛肉与双层香软芝，加上松软面包及美味酱料，诱惑无人能挡！',
    price: 20,
    image: '/img/meals/2.png',
  },
  {
    id: '3',
    name: '巨无霸',
    description:
      '两块百分百纯牛肉，搭配生菜、洋葱等新鲜食材，口感丰富，极致美味！',
    price: 24,
    image: '/img/meals/3.png',
  },
  {
    id: '4',
    name: '麦辣鸡腿汉堡',
    description:
      '金黄脆辣的外皮，鲜嫩幼滑的鸡腿肉，多重滋味，一次打动您挑剔的味蕾！',
    price: 21,
    image: '/img/meals/4.png',
  },
  {
    id: '5',
    name: '板烧鸡腿堡',
    description:
      '原块去骨鸡排嫩滑多汁，与翠绿新鲜的生菜和香浓烧鸡酱搭配，口感丰富！',
    price: 22,
    image: '/img/meals/5.png',
  },
  {
    id: '6',
    name: '麦香鸡',
    description: '清脆爽口的生菜，金黄酥脆的鸡肉。营养配搭，好滋味的健康选择！',
    price: 14,
    image: '/img/meals/6.png',
  },
  {
    id: '7',
    name: '吉士汉堡包',
    description:
      '百分百纯牛肉与香软芝士融为一体配合美味番茄醬丰富口感一咬即刻涌现！',
    price: 12,
    image: '/img/meals/7.png',
  },
];

const App = () => {
  const [meals, setMeals] = useState(INITIAL_MEALS);

  return (
    <div>
      <MealsList meals={meals} />
      <Cart />
    </div>
  );
};

export default App;
