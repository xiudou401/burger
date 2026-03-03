import React, { MouseEvent, useEffect, useState } from 'react';
import classes from './Cart.module.css';
import iconImg from '../../asset/bag.png';
import CartDetails from './CartDetails/CartDetails';
import Checkout from './Checkout/Checkout';
import { useCartSelectors } from '../../hooks/useCartSelectors';

const Cart = () => {
  const {
    totalQuantity,

    quote,
    quoteStale,
    quoteMismatch,
    estimatedTotalPrice,

    ensureQuote,
    clearQuote,
  } = useCartSelectors();

  const [showCartDetails, setShowCartDetails] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const toggleCartDetailsHandler = async () => {
    if (totalQuantity === 0) return;

    // ✅ 打开详情前先确保有 quote（只会校验一次，且有去重锁）
    if (!showCartDetails) {
      await ensureQuote();
    }

    setShowCartDetails((prev) => !prev);
  };

  const onCheckout = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (totalQuantity === 0) return;

    try {
      await ensureQuote(); // ✅ 同样：需要时才校验，不重复
      setShowCheckout(true);
    } catch {
      alert('购物车校验失败，请稍后重试');
    }
  };

  const offCheckout = () => setShowCheckout(false);

  // ✅ 清空购物车时：关闭面板 + 清 quote
  useEffect(() => {
    if (totalQuantity === 0) {
      setShowCheckout(false);
      setShowCartDetails(false);
      clearQuote();
    }
  }, [totalQuantity, clearQuote]);

  return (
    <div className={classes.Cart} onClick={toggleCartDetailsHandler}>
      {showCartDetails && <CartDetails open={showCartDetails} />}

      {showCheckout && quote && (
        <Checkout offCheckout={offCheckout} meals={quote.meals} />
      )}

      <div className={classes.CartIcon}>
        <img className={classes.CartIconImg} src={iconImg} alt="Shopping bag" />
        {totalQuantity > 0 && (
          <span className={classes.TotalQuantity}>{totalQuantity}</span>
        )}
      </div>

      {totalQuantity === 0 ? (
        <p className={classes.NoMeal}>Cart is empty</p>
      ) : !quote ? (
        <p className={classes.Price}>Ready to checkout</p>
      ) : (
        <p className={classes.Price}>
          ¥ {estimatedTotalPrice.toFixed(2)}
          {(quoteStale || quoteMismatch) && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>
              （估算）
            </span>
          )}
        </p>
      )}

      <button
        className={`${classes.BuyButton} ${
          totalQuantity === 0 && classes.Disabled
        }`}
        onClick={onCheckout}
      >
        Buy
      </button>
    </div>
  );
};

export default Cart;
