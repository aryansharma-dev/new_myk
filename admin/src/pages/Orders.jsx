import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types"; // Fix: define PropTypes instead of referencing an undefined helper.
import { toast } from "react-toastify";
import { currency } from "../assets/constants"; // Fix: point to the actual constants module so bundler resolves correctly.
import { assets } from "../assets/assets";
import { api } from "../lib/api";

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const data = await api("/order/list", { method: "POST" });
      if (data.success) {
        const rows = data?.data?.orders || data.orders || [];
        setOrders(rows.slice().reverse()); // Fix: clone before reversing so we do not mutate the API response array.
      } else {
        toast.error(data.message || "Failed to load orders");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    }
    // Fix: memoize the fetch handler so useEffect can depend on it safely
  }, [token]);

  const statusHandler = async (event, orderId) => {
    try {
      const data = await api("/order/status", {
        method: "POST",
        body: { orderId, status: event.target.value },
      });
      if (data.success) {
        await fetchAllOrders();
      } else {
        toast.error(data.message || "Failed to update order");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    // Fix: include the memoized dependency to satisfy exhaustive-deps lint rule.
  }, [fetchAllOrders]);

  return (
    <div>
      <h3>Order Page</h3>
      <div>
        {orders.map((order, index) => {
          const items = Array.isArray(order.items) && order.items.length
            ? order.items
            : Array.isArray(order.cartItems)
              ? order.cartItems
              : [];
          const address = order.address || {};
          const amount = order.amount ?? order.totalAmount ?? 0;

          return (
            <div
              className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700"
              key={order._id || index}
            >
              <img className="w-12" src={assets.parcel_icon} alt="" />
              <div>
               <div>
                  {items.map((item, idx) => (
                    <p className="py-0.5" key={`${item._id || idx}-${idx}`}>
                      {item.name} x {item.quantity} <span>{item.size}</span>
                      {idx < items.length - 1 ? "," : ""}
                    </p>
                  ))}
                </div>
                <p className="mt-3 mb-2 font-medium">{`${address.firstName || ""} ${address.lastName || ""}`.trim()}</p>
                <div>
                  <p>{address.street ? `${address.street},` : ""}</p>
                  <p>
                    {[address.city, address.state, address.country, address.zipcode]
                      .filter(Boolean)
                      .join(", ")}
                    </p>
                  </div>
                <p>{address.phone}</p>
              </div>
              <div>
                <p className="text-sm sm:text-[15px]">Items : {items.length}</p>
                <p className="mt-3">Method : {order.paymentMethod}</p>
                <p>Payment : {order.payment ? "Done" : "Pending"}</p>
                <p>Date : {new Date(order.date).toLocaleDateString()}</p>
                </div>
                <p className="text-sm sm:text-[15px]">
                {currency}
                {amount}
              </p>
              <select
                onChange={(event) => statusHandler(event, order._id)}
                value={order.status}
                className="p-2 font-semibold"
              >
                <option value="Order Placed">Order Placed</option>
                <option value="Packing">Packing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for delivery">Out for delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};

Orders.propTypes = {
token: PropTypes.string, // Fix: ensure prop validation uses the actual PropTypes helper.
};

export default Orders;