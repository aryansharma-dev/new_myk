import {useContext} from "react";
import ShopContext from '../context/ShopContextInstance';
import Title from "./Title";

const formatAmount = (currency, amount) => {
  const value = Number(amount) || 0;
  return `${currency} ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const CartTotal = () => {
  const { currency, getCartSummary } = useContext(ShopContext);
  const summary = getCartSummary();

  return (
    <div className="w-full">
      <div className="text-2xl">
        <Title text1={"CART"} text2={"TOTALS"} />
      </div>

      <div className="flex flex-col gap-2 mt-2 text-sm">
        <div className="flex justify-between">
          <p>Subtotal</p>
          <p>{formatAmount(currency, summary.subtotal)}</p>
        </div>
        <hr />
        <div className="flex justify-between">
          <p>Shipping Fee</p>
          <p>{formatAmount(currency, summary.shipping)}</p>
        </div>
        <hr />
        <div className="flex justify-between">
          <b>Total</b>
          <b>{formatAmount(currency, summary.total)}</b>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;
