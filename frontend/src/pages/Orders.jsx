import {useContext, useEffect, useState, useMemo, useCallback} from 'react';
import ShopContext from '../context/ShopContextInstance';
import Title from '../components/Title';
import api from '../lib/api';
import usePageMetadata from '../hooks/usePageMetadata';
import { getPrimaryProductImage } from '../utils/productImages';

const Orders = () => {
  const { token, currency, ensureProductLoaded, productMap } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const [resolvedImages, setResolvedImages] = useState({});

  const loadOrderData = useCallback(async () => {
    try {
       if (!token) return;

      const { data } = await api.post('/api/order/userorders');
      if (data.success) {
        const allItems = [];
        (data.orders || []).forEach((order) => {
          (order.items || []).forEach((item) => {
            allItems.push({
              ...item,
              status: order.status,
              payment: order.payment,
              paymentMethod: order.paymentMethod,
              date: order.date,
            });
          });
        });
        setOrderData(allItems.reverse());
      }
    } catch (error) {
      console.error('loadOrderData failed', error);
    }
  }, [token]);

 useEffect(() => {
    loadOrderData();
  }, [loadOrderData]);
  
  useEffect(() => {
    const missing = new Set();
    const updates = {};
    let hasImmediateUpdates = false;

    orderData.forEach((item) => {
      const pid = String(item.product || item.productId || item._id || "");
      if (!pid) return;

      const storedImage = typeof item.image === 'string' && item.image.trim();
      if (storedImage) {
        if (resolvedImages[pid] !== storedImage) {
          updates[pid] = storedImage;
          hasImmediateUpdates = true;
        }
        return;
      }

      const cachedProduct = productMap.get(pid);
      const cachedImage = getPrimaryProductImage(cachedProduct);
      if (cachedImage) {
        if (resolvedImages[pid] !== cachedImage) {
          updates[pid] = cachedImage;
          hasImmediateUpdates = true;
        }
        return;
      }

      if (!resolvedImages[pid]) {
        missing.add(pid);
      }
    });

    if (hasImmediateUpdates) {
      setResolvedImages((prev) => ({ ...prev, ...updates }));
    }

    if (!missing.size) return;

    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        Array.from(missing).map(async (pid) => {
          try {
            const product = await ensureProductLoaded(pid);
            return [pid, getPrimaryProductImage(product)];
          } catch (error) {
            console.error('Failed to load product for order', pid, error);
            return [pid, null];
          }
        })
      );
      if (cancelled) return;
      setResolvedImages((prev) => {
        let changed = false;
        const next = { ...prev };
        results.forEach(([pid, image]) => {
          if (pid && image && next[pid] !== image) {
            next[pid] = image;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [orderData, ensureProductLoaded, productMap, resolvedImages]);

  const ordersStructuredData = useMemo(
    () =>
      ({ absoluteCanonical, baseTitle, pageDescription }) => [
        {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          '@id': `${absoluteCanonical}#orders`,
          url: absoluteCanonical,
          name: baseTitle,
          description: pageDescription,
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: orderData.length,
          },
        },
      ],
    [orderData.length]
  );

  usePageMetadata({
    title: 'Your TinyMillion Orders',
    description: 'Track TinyMillion purchases, check fulfilment statuses, and revisit past order details in one place.',
    keywords: 'TinyMillion orders, track shipment, order history',
    canonical: '/orders',
    robots: 'noindex, nofollow',
    structuredData: ordersStructuredData,
  });
  
  return (
    <div className='border-t pt-16'>
      <div className='text-2xl'>
        <Title text1={'MY'} text2={'ORDERS'} />
      </div>

          <div>
            {orderData.map((item, index) => {
              const pid = String(item.product || item.productId || item._id || index);
              const storedImage = typeof item.image === 'string' && item.image.trim();
              const fallbackImage = resolvedImages[pid] || getPrimaryProductImage(productMap.get(pid));
              const imageSrc = storedImage || fallbackImage || null;
              return (
                <div
                  key={`${item._id || index}-${index}`}
                  className='py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4'
                >
                  <div className='flex items-start gap-6 text-sm'>
                    {imageSrc ? (
                      <img
                        className='w-16 sm:w-20 object-cover'
                        src={imageSrc}
                        alt={item.name || 'Ordered product'}
                        loading='lazy'
                        decoding='async'
                      />
                    ) : (
                      <div className='w-16 sm:w-20 bg-gray-100 flex items-center justify-center text-xs'>
                        No image
                      </div>
                    )}
                    <div>
                      <p className='sm:text-base font-medium'>{item.name}</p>
                      <div className='flex items-center gap-3 mt-1 text-base text-gray-700'>
                        <p>{currency}{item.price}</p>
                        <p>Quantity: {item.quantity}</p>
                                 <p>Size: {item.size}</p>
                      </div>
                      <p className='mt-1'>Date: <span className=' text-gray-400'>{new Date(item.date).toDateString()}</span></p>
                      <p className='mt-1'>Payment: <span className=' text-gray-400'>{item.paymentMethod}</span></p>
                    </div>
                  </div>
                  <div className='md:w-1/2 flex justify-between'>
                    <div className='flex items-center gap-2'>
                      <p className='min-w-2 h-2 rounded-full bg-green-500'></p>
                      <p className='text-sm md:text-base'>{item.status}</p>
                    </div>
                    <button onClick={loadOrderData} className='border px-4 py-2 text-sm font-medium rounded-sm'>Track Order</button>
                  </div>
                </div>
               );
            })}
      </div>
    </div>
  );
};

export default Orders;
