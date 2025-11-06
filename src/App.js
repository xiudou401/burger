import { useReducer, useState } from 'react';
import MealsList from './components/Meals/MealsList';
import { CartContext } from './store/CartContext';

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

const initialCartState = {
  items: [],
  totalQuantity: 0,
  totalPrice: 0,
};

const CartReducer = (state, action) => {
  let updatedCartItems = [...state.items];
  const updateTotals = (items) => {
    const updateQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const updatePrice = items.reduce(
      (sumPrice, item) => sumPrice + item.quantity * item.price,
      0
    );
    return { updatePrice, updateQuantity };
  };
  switch (action.type) {
    default:
      return state;
    case 'ADD':
    case 'REMOVE':
      {
        if (!action.meal) {
          return state;
        }
        let existingMealIndex = updatedCartItems.findIndex(
          (item) => item.id === action.meal.id
        );
        if (action.type === 'ADD') {
          if (existingMealIndex === -1) {
            updatedCartItems = [
              ...updatedCartItems,
              { ...action.meal, quantity: 1 },
            ];
          } else {
            updatedCartItems[existingMealIndex] = {
              ...updatedCartItems[existingMealIndex],
              quantity: updatedCartItems[existingMealIndex].quantity + 1,
            };
          }
        } else {
          if (updatedCartItems[existingMealIndex].quantity > 1) {
            updatedCartItems[existingMealIndex] = {
              ...updatedCartItems[existingMealIndex],
              quantity: updatedCartItems[existingMealIndex].quantity - 1,
            };
          } else {
            updatedCartItems = updatedCartItems.filter(
              (item) => item.id !== action.meal.id
            );
          }
        }
      }
      const { totalQuantity, totalPrice } = updateTotals(updatedCartItems);
      return { items: updatedCartItems, totalQuantity, totalPrice };
  }
};

const App = () => {
  const [meals, setMeals] = useState(INITIAL_MEALS);
  const [state, cartDispatch] = useReducer(CartReducer, initialCartState);

  return (
    <CartContext.Provider value={{ ...state, cartDispatch }}>
      <div>
        <MealsList meals={meals} />
      </div>
    </CartContext.Provider>
  );
};

export default App;
