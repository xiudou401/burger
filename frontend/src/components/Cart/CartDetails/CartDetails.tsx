import React, { MouseEvent, useEffect, useMemo, useState } from 'react';
import classes from './CartDetails.module.css';
import Backdrop from '../../UI/Backdrop/Backdrop';
import MealItem from '../../Meals/Meal/MealItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import Confirm from '../../UI/Confirm/Confirm';
import { useCartActions } from '../../../hooks/useCartActions';
import { useCartSelectors } from '../../../hooks/useCartSelectors';

interface CartDetailsProps {
  open: boolean;
}

const CartDetails = ({ open }: CartDetailsProps) => {
  const { clearCart } = useCartActions();

  const { items, quote, ensureQuote, getItemQuantity } = useCartSelectors();

  const [showConfirm, setShowConfirm] = useState(false);

  // ✅ 打开时确保有 quote（只会在需要时请求）
  useEffect(() => {
    if (!open) return;
    if (items.length === 0) return;
    ensureQuote();
  }, [open, items.length, ensureQuote]);

  // ✅ 用“quote 的商品信息” + “cart 的实时 quantity”来展示
  const mealsWithLiveQty = useMemo(() => {
    const meals = quote?.meals ?? [];
    console.log(meals);
    return meals
      .map((m) => ({ ...m, quantity: getItemQuantity(m.id) }))
      .filter((m) => m.quantity > 0);
  }, [quote, getItemQuantity]);

  const handleClearCart = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const onOk = () => clearCart();
  const onCancel = () => setShowConfirm(false);

  return (
    <Backdrop>
      {showConfirm && (
        <Confirm confirmText="Are you sure?" onCancel={onCancel} onOk={onOk} />
      )}

      <div
        className={classes.CartDetails}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <header className={classes.Header}>
          <h2 className={classes.Title}>餐品详情</h2>
          <div className={classes.Clear} onClick={handleClearCart}>
            <FontAwesomeIcon icon={faTrash} />
            <span>清空购物车</span>
          </div>
        </header>

        <div className={classes.MealList}>
          {/* ✅ quote 还没到时的状态 */}
          {!quote && items.length > 0 && (
            <p style={{ padding: 12 }}>加载中...</p>
          )}

          {/* ✅ 用实时 quantity 渲染 */}
          {mealsWithLiveQty.map((meal) => (
            <MealItem
              key={meal.id}
              meal={meal} // meal 提供 name/price/image/desc
              noDesc
              quantity={meal.quantity} // ✅ 实时 quantity
              onFirstInteract={ensureQuote} // ✅ 继续保证新增 id 时能补齐 quote
            />
          ))}

          {/* ✅ 如果 quote 到了但 list 为空（比如全部减到 0） */}
          {quote && mealsWithLiveQty.length === 0 && (
            <p style={{ padding: 12, color: '#999' }}>购物车为空</p>
          )}
        </div>
      </div>
    </Backdrop>
  );
};

export default CartDetails;
