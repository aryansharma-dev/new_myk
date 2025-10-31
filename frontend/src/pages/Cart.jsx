import {useContext, useEffect, useMemo} from 'react';
import ShopContext from '../context/ShopContextInstance';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { getPrimaryProductImage } from '../utils/productImages';
import usePageMetadata from '../hooks/usePageMetadata';

const Cart = () => {
    const {
    currency,
    cartItems,
    updateQuantity,
    navigate,
    token,
    getCartCount,
    getCartSummary,
    productMap,
    ensureProductLoaded,  
  } = useContext(ShopContext);

  const cartData = useMemo(() => {
  const rows = [];
    for (const pid in cartItems) {
      for (const size in cartItems[pid]) {
        const qty = cartItems[pid][size];
        if (qty > 0) {
          rows.push({ _id: pid, size, quantity: qty });
        }
      }
    }
    return rows;
  }, [cartItems]);
  
  useEffect(() => {
    const missingIds = cartData
      .map((item) => String(item._id))
      .filter((id) => id && !productMap.has(id));

    if (!missingIds.length) return;

    Promise.all(missingIds.map((id) => ensureProductLoaded(id))).catch((error) => {
      console.error('Failed to load cart product', error);
    });
  }, [cartData, productMap, ensureProductLoaded]);

  const summary = getCartSummary();
  const awaitingProducts = useMemo(
    () => cartData.some((item) => !productMap.has(String(item._id))),
    [cartData, productMap]
  );
  const hasItems = getCartCount() > 0 && summary.subtotal > 0 && !awaitingProducts;
  
  const cartStructuredData = useMemo(
    () =>
      ({ absoluteCanonical, baseTitle, pageDescription }) => [
        {
          '@context': 'https://schema.org',
          '@type': 'ShoppingCart',
          '@id': `${absoluteCanonical}#cart`,
          url: absoluteCanonical,
          name: baseTitle,
          description: pageDescription,
          numberOfItems: cartData.length,
          potentialAction: {
            '@type': 'CheckoutAction',
            target: `${absoluteCanonical.replace('/cart', '')}/checkout`,
          },
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: Number(summary.subtotal || 0),
            highPrice: Number(summary.total || summary.subtotal || 0),
            offerCount: cartData.length,
          },
        },
      ],
    [cartData.length, summary.subtotal, summary.total]
  );

  usePageMetadata({
    title: 'Your Shopping Cart',
    description:
      'Review the items saved in your TinyMillion cart and update sizes or quantities before placing your order.',
    keywords: 'TinyMillion cart, review order, checkout preparation, saved items',
    canonical: '/cart',
    robots: 'noindex, nofollow',
    structuredData: cartStructuredData,
  });

  return (
    <div className='p-4 md:px-8'>
      <Title title='Cart' />
      <div>
        {cartData.map((item, index) => {
          const productData = productMap.get(String(item._id));
          const imgSrc = getPrimaryProductImage(productData);
          const isLoadingProduct = !productData;
          return (
            <div
              key={`${item._id}-${item.size}-${index}`}
              className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
            >
              <div className='flex items-start gap-6'>
              {imgSrc ? (
                  <img
                    className='w-16 sm:w-20 object-cover'
                    src={imgSrc}
                    alt={productData?.name || 'Product'}
                    loading='lazy'
                    decoding='async'
                  />
                ) : (
                  <div className='w-16 sm:w-20 bg-gray-100 flex items-center justify-center text-xs'>
                    No image
                  </div>
                )}
                <div>
                 <p className='text-xs sm:text-lg font-medium'>{productData?.name || (isLoadingProduct ? 'Loading product…' : 'Product')}</p>
                  <div className='flex items-center gap-5 mt-2'>
                    <p>{currency}{productData?.price ?? (isLoadingProduct ? '--' : 0)}</p>
                    <p className='px-2 sm:px-3 sm:py-1 border bg-slate-50'>{item.size}</p>
                  </div>
                </div>
              </div>

              <input
                onChange={(e) => {
                  if (e.target.value === '' || e.target.value === '0') return;
                  updateQuantity(item._id, item.size, Number(e.target.value));
                }}
                className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1'
                type='number'
                min={1}
                defaultValue={item.quantity}
              />

              <img
                onClick={() => updateQuantity(item._id, item.size, 0)}
                className='w-4 mr-4 sm:w-5 cursor-pointer'
                src={assets.bin_icon}
                alt='remove'
                loading='lazy'
                decoding='async'
              />
            </div>
          );
        })}
        {!cartData.length && (
          <div className='py-10 text-center text-gray-500'>Your cart is empty.</div>
        )}
        {awaitingProducts && cartData.length > 0 && (
          <div className='py-4 text-sm text-gray-500'>Refreshing product details…</div>
        )}
      </div>

      <div className='flex justify-end my-20'>
        <div className='w-full sm:w-[450px]'>
          <CartTotal />
          <div className='w-full text-end'>
            <button
              onClick={() => token ? navigate('/place-order') : navigate('/login', { state: { from: '/place-order' } })}
              disabled={!hasItems}
              className={`bg-black text-white text-sm my-8 px-8 py-3 ${!hasItems ? 'opacity-60 cursor-not-allowed' : ''}`}
              title={!hasItems ? 'Add items to your cart first' : 'Proceed to Checkout'}
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
