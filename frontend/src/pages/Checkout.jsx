import {useContext} from "react";
import { useNavigate } from "react-router-dom";
import CartTotal from "../components/CartTotal";
import ShopContext from '../context/ShopContextInstance';
import usePageMetadata from "../hooks/usePageMetadata";

const Checkout = () => {
  const navigate = useNavigate();
  const { getCartSummary, getCartCount } = useContext(ShopContext);
  const summary = typeof getCartSummary === "function" ? getCartSummary() : { subtotal: 0, shipping: 0, total: 0 };
  const cartCount = typeof getCartCount === "function" ? getCartCount() : 0;
  const paymentsConfigured = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);
  
  usePageMetadata({
    title: 'Checkout Overview',
    description:
      'Confirm your TinyMillion order total, shipping charges, and item counts before completing a secure checkout.',
    keywords: 'TinyMillion checkout, order summary, secure payment',
    canonical: '/checkout',
    robots: 'noindex, nofollow',
    structuredData: ({ absoluteCanonical, baseTitle, pageDescription }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'CheckoutPage',
        '@id': `${absoluteCanonical}#checkout`,
        url: absoluteCanonical,
        name: baseTitle,
        description: pageDescription,
        potentialAction: {
          '@type': 'PayAction',
          target: `${absoluteCanonical.replace('/checkout', '')}/place-order`,
        },
        orderQuantity: cartCount,
        totalPaymentDue: {
          '@type': 'PriceSpecification',
          priceCurrency: 'INR',
          price: Number(summary.total || 0),
        },
      },
    ],  
  });

  return (
      <div className="mx-auto max-w-xl space-y-6 py-8">
      <h2 className="text-2xl font-semibold">Checkout</h2>
      <p className="text-gray-600">
        Review your order summary below. When you&rsquo;re ready, continue to the secure checkout page to choose your payment method and confirm delivery details.
      </p>

      {!paymentsConfigured && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
          Online payments are disabled in this development environment. Orders will be processed as Cash on Delivery.
        </div>
      )}

      <div className="rounded-md border border-gray-200 p-4">
        <CartTotal />
        <p className="mt-2 text-sm text-gray-500">Items in cart: {cartCount}</p>
        <p className="text-sm text-gray-500">Estimated shipping: ₹{summary.shipping}</p>
        <p className="text-sm font-medium">Total payable: ₹{summary.total}</p>
      </div>

      <button
        onClick={() => navigate("/place-order")}
        className="w-full rounded-md bg-black py-3 text-white transition hover:bg-gray-800"
      >
        Continue to secure checkout
      </button>
    </div>
  );
};

export default Checkout;
