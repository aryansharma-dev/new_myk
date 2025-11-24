import { useState } from 'react';
import api from '../lib/api';

const NewsletterBox = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const { data } = await api.post('/api/newsletter/subscribe', { email });
      if (data.success) {
        setMessage('✅ Thank you for subscribing!');
        setEmail('');
      } else {
        setMessage(`❌ ${data.message || 'Subscription failed'}`);
      }
    } catch (error) {
      console.error('Newsletter error:', error);
      const msg = error?.response?.data?.message || error.message;
      setMessage(`❌ ${msg || 'Something went wrong. Please try again later.'}`);
    }
  };

  return (
    <div className="text-center">
      <p className="text-2xl font-medium text-gray-800 dark:invert">Subscribe now & get 20% off</p>
      <p className="text text-gray-400 mt-3 dark:invert">
        Join the TinyMillion family and stay updated with exclusive offers, new arrivals, and style inspiration — straight to your inbox.
      </p>
      <form
        onSubmit={onSubmitHandler}
        className="w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 border pl-3"
      >
        <input
          className="w-full sm:flex-1 outline-none bg-white text-black dark:bg-black dark:text-white placeholder-gray-400 dark:placeholder-gray-50 border border-gray-300 dark:border-gray-60 rounded-md p-2"
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder='Enter your email'
        />
        <button
          type='submit'
          className="bg-black text-white text-xs px-10 py-4 dark:invert"
        >
          SUBSCRIBE
        </button>
      </form>
      {message && <p className='mt-3 text-sm'>{message}</p>}
    </div>
  );
};

export default NewsletterBox;