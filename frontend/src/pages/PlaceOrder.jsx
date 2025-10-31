import {useContext, useState, useEffect, useMemo, useRef, useCallback} from "react";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import ShopContext from '../context/ShopContextInstance';
import { useLocation } from "react-router-dom";
import api from "../lib/api";
import { toast } from "react-toastify";
import usePageMetadata from "../hooks/usePageMetadata";
import { getPrimaryProductImage } from "../utils/productImages";

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod");
  const {
    navigate,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    productMap,
    ensureProductLoaded,
  } = useContext(ShopContext);

  // + location fix (was missing)
  const location = useLocation();

  // + loading to prevent double submit
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const razorpayLoaderRef = useRef(null);
  
  // ensure trimmed env key check
  const paymentsConfigured = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID?.trim());

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true, state: { from: location?.pathname || "/" } });
    }
    // depend on location object to avoid pathname undefined issues
  }, [token, navigate, location]);

  const placeOrderStructuredData = useMemo(
    () =>
      ({ absoluteCanonical, baseTitle, pageDescription }) => [
        {
          '@context': 'https://schema.org',
          '@type': 'CheckoutPage',
          '@id': `${absoluteCanonical}#place-order`,
          url: absoluteCanonical,
          name: baseTitle,
          description: pageDescription,
          paymentAccepted: method === 'cod' ? ['Cash'] : ['Card', 'OnlinePayment'],
          potentialAction: {
            '@type': 'PayAction',
            target: absoluteCanonical,
          },
        },
      ],
    [method]
  );

  usePageMetadata({
    title: 'Secure Checkout Details',
    description:
      'Provide delivery information and choose a payment method to place your TinyMillion order securely.',
    keywords: 'TinyMillion place order, delivery form, payment method, secure checkout',
    canonical: '/place-order',
    robots: 'noindex, nofollow',
    structuredData: placeOrderStructuredData,
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const ensureRazorpay = useCallback(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      return Promise.resolve(true);
    }

    if (razorpayLoaderRef.current) {
      return razorpayLoaderRef.current;
    }

    razorpayLoaderRef.current = new Promise((resolve, reject) => {
      if (typeof document === "undefined") {
        reject(new Error("Document is unavailable to load Razorpay"));
        return;
      }

      const attach = (script) => {
        script.addEventListener(
          "load",
          () => {
            resolve(true);
          },
          { once: true }
        );
        script.addEventListener(
          "error",
          () => {
            reject(new Error("Failed to load Razorpay checkout"));
          },
          { once: true }
        );
      };

      const existing = document.getElementById("razorpay-sdk");
      if (existing) {
        attach(existing);
        return;
      }

      const script = document.createElement("script");
      script.id = "razorpay-sdk";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      attach(script);
      document.body.appendChild(script);
    }).catch((error) => {
      razorpayLoaderRef.current = null;
      throw error;
    });

    return razorpayLoaderRef.current;
  }, []);

  useEffect(() => {
    if (method === "razorpay" && paymentsConfigured) {
      ensureRazorpay().catch((error) => {
        console.warn(error);
      });
    }
  }, [method, ensureRazorpay, paymentsConfigured]);

  const initPay = async (order) => {
    try {
      await ensureRazorpay();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Failed to load Razorpay");
      return;
    }

    const options = {
      key: order?.key || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Order Payment",
      description: "Order Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        try {
          const { data } = await api.post("/api/order/verifyRazorpay", response);
          if (data.success) {
            navigate("/orders");
            setCartItems({});
          } else {
            toast.error(data.message || "Verification failed");
          }
        } catch (error) {
          console.error(error);
          toast.error(error?.response?.data?.message || error.message);
        }
      },
    };

    // guard against missing SDK
    if (!window?.Razorpay) {
      toast.warn("Razorpay SDK is unavailable. Simulating success.");
      navigate("/orders");
      setCartItems({});
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const buildOrderPayload = useCallback(
    async (selectedMethod = method) => {
      const cart = cartItems || {};
      const uniqueIds = new Set();
      for (const pid in cart) {
        if (Object.prototype.hasOwnProperty.call(cart, pid)) {
          uniqueIds.add(String(pid));
        }
      }

      const productCache = new Map();
      await Promise.all(
        Array.from(uniqueIds)
          .filter(Boolean)
          .map(async (pid) => {
            const existing = productMap.get(pid);
            if (existing) {
              productCache.set(pid, existing);
              return;
            }
            const fetched = await ensureProductLoaded(pid);
            if (fetched) {
              productCache.set(pid, fetched);
            }
          })
      );

      const orderItems = [];
      for (const pid in cart) {
        if (!Object.prototype.hasOwnProperty.call(cart, pid)) continue;
        const sizes = cart[pid] || {};
        const product = productCache.get(String(pid)) || productMap.get(String(pid));
        if (!product) continue;

        for (const size in sizes) {
          if (!Object.prototype.hasOwnProperty.call(sizes, size)) continue;
          const qty = Number(sizes[size]) || 0;
          if (qty <= 0) continue;
          const imageUrl = getPrimaryProductImage(product) || null;
          orderItems.push({
            product: product._id,
            name: product.name,
            price: Number(product.price) || 0,
            size,
            quantity: qty,
            image: imageUrl,
          });
        }
      }

    const subtotal = Number(getCartAmount ? getCartAmount() : 0) || 0;
      const deliveryFee = Number(delivery_fee || 0) || 0;
      const total = subtotal + deliveryFee;

      return {
        address: formData,
        cartItems: orderItems,
        items: orderItems,
        totalAmount: total,
        amount: total,
        subtotal,
        deliveryFee,
        paymentMethod: selectedMethod,
      };
    },
    [cartItems, ensureProductLoaded, getCartAmount, delivery_fee, formData, method, productMap]
  );

  const isCartEmpty = () => {
    const cart = cartItems || {};
    return Object.keys(cart).length === 0;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Prevent empty cart
    if (isCartEmpty()) {
      toast.info("Cart is empty. Add items before placing order.");
      return;
    }

    // Basic phone validation (10 digits) - optional
    if (!/^\d{10}$/.test(formData.phone || "")) {
      toast.info("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    try {
      const orderData = await buildOrderPayload();
      if (!orderData?.cartItems?.length) {
        toast.error("Unable to prepare your order. Please refresh and try again.");
        setLoading(false);
        return;
      }

      // fallback to COD if payments not configured
      if (!paymentsConfigured && method !== "cod") {
        toast.info("Online payments disabled in this environment. Using Cash on Delivery instead.");
        const fallbackData = await buildOrderPayload("cod");
        const { data } = await api.post("/api/order/place", fallbackData);
        if (data.success) {
          toast.success(data.message || "Order placed");
          setMethod("cod");
          setCartItems({});
          navigate("/orders");
        } else {
          toast.error(data.message || "Unable to place order");
        }
        setLoading(false);
        return;
      }

      switch (method) {
        case "cod": {
          const { data } = await api.post("/api/order/place", orderData);
          if (data.success) {
            toast.success(data.message || "Order placed");
            setCartItems({});
            navigate("/orders");
          } else {
            toast.error(data.message || "Unable to place order");
          }
          break;
        }
        case "stripe": {
          const { data } = await api.post("/api/order/stripe", orderData);
          if (data.success) {
            const sessionUrl = data?.data?.session_url || data.session_url;
            if (sessionUrl) {
              window.location.replace(sessionUrl);
            } else {
              toast.info("Stripe session created (no redirect URL returned)");
            }
          } else {
            toast.error(data.message || "Stripe checkout failed");
          }
          break;
        }
        case "razorpay": {
          const { data } = await api.post("/api/order/razorpay", orderData);
          if (data.success) {
            const order = data?.data?.order || data.order;
            if (order?.id) {
              await initPay({ ...order, key: data?.data?.key || data.key });
            } else {
              toast.success(data.message || "Payment completed");
              navigate("/orders");
              setCartItems({});
            }
          } else {
            toast.error(data.message || "Razorpay payment failed");
          }
          break;
        }
        default:
          toast.error("Unknown payment method");
          break;
      }
    } catch (error) {
      console.error(error);
      const status = error?.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
      toast.error(error?.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t px-4 md:px-8">
      {/* ------------- Left Side ---------------- */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>
        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            required
            onChange={onChangeHandler}
            name="firstName"
            value={formData.firstName}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="First name"
          />
          <input
            required
            onChange={onChangeHandler}
            name="lastName"
            value={formData.lastName}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Last name"
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name="email"
          value={formData.email}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="email"
          placeholder="Email address"
        />
        <input
          required
          onChange={onChangeHandler}
          name="street"
          value={formData.street}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text"
          placeholder="Street"
        />
        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            required
            onChange={onChangeHandler}
            name="city"
            value={formData.city}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="City"
          />
          <input
            onChange={onChangeHandler}
            name="state"
            value={formData.state}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="State"
          />
        </div>
        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            required
            onChange={onChangeHandler}
            name="zipcode"
            value={formData.zipcode}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Zipcode"
          />
          <input
            required
            onChange={onChangeHandler}
            name="country"
            value={formData.country}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Country"
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name="phone"
          value={formData.phone}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="tel"
          placeholder="Phone"
        />
      </div>

      {/* ------------- Right Side ------------------ */}
      <div className='mt-8'>

        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>
        
        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHOD"} />

          {!paymentsConfigured && (
            <div className="mt-3 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
              Payments run in mock mode locally. Cash on Delivery works as usual.
            </div>
          )}

          <div className='flex gap-3 flex-col lg:flex-row'>
              <div onClick={() => setMethod('stripe')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                  <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'stripe' ? 'bg-green-400' : ''}`}></p>
                  <img className='h-5 mx-4' src={assets.stripe_logo} alt="Stripe" loading='lazy' decoding='async' />
              </div>
              <div onClick={() => setMethod("razorpay")} className="flex items-center gap-3 border p-2 px-3 cursor-pointer">
                  <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'razorpay' ? 'bg-green-400' : ''}`}></p>
                  <img className='h-5 mx-4' src={assets.razorpay_logo} alt="Razorpay" loading='lazy' decoding='async' />
              </div>
              <div onClick={() => setMethod("cod")} className="flex items-center gap-3 border p-2 px-3 cursor-pointer">
                  <p className={`min-w-3.5 h-3.5 border rounded-full ${method === "cod" ? "bg-green-400" : ""}`} ></p>
                  <p className='text-gray-500 text-sm font-medium mx-4'>CASH ON DELIVERY</p>
              </div>
          </div>

        </div>
        <div className="w-full text-end mt-8">
         <button
            type="submit"
            className={`bg-black text-white px-16 py-3 text-sm ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            disabled={loading || isCartEmpty()}>
            {loading ? "Placing order..." : isCartEmpty() ? "Cart empty" : "PLACE ORDER"}
          </button>
        </div>

      </div>
    </form>
  );
};

export default PlaceOrder;
