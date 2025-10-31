import {useContext, useEffect, useCallback} from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ShopContext from '../context/ShopContextInstance';
import api from '../lib/api';
import usePageMetadata from '../hooks/usePageMetadata';

const Verify = () => {

  const { navigate, token, setCartItems } = useContext(ShopContext);
  const [searchParams] = useSearchParams();

  const success = searchParams.get('success');
  const orderId = searchParams.get('orderId');

  const verifyPayment = useCallback(async () => {
    try {
      if (!token) {
        return null;
      }

      const { data } = await api.post('/api/order/verifyStripe', { success, orderId });

      if (data.success) {
        setCartItems({});
        navigate('/orders');
      } else {
        navigate('/cart');
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || error.message);
    }
  }, [token, success, orderId, setCartItems, navigate]);
    useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  usePageMetadata({
    title: 'Processing Payment',
    description: 'We are verifying your TinyMillion payment and will redirect you once the process is complete.',
    keywords: 'TinyMillion payment verification, order confirmation',
    canonical: '/verify',
    robots: 'noindex, nofollow',
    structuredData: ({ absoluteCanonical, baseTitle, pageDescription }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'ConfirmAction',
        '@id': `${absoluteCanonical}#payment-verify`,
        name: baseTitle,
        target: absoluteCanonical,
        description: pageDescription,
      },
    ],
  });

  return (
    <div className='min-h-[40vh] flex items-center justify-center text-gray-600'>
      Finalising your payment...
    </div>
  );
};

export default Verify;