import {useContext, useEffect, useState} from 'react';
import ShopContext from '../context/ShopContextInstance';
import Title from './Title';
import ProductItem from './ProductItem';
import { getProductImageArray } from '../utils/productImages';

// This component renders the latest products from the store. It
// previously attempted to access `item.image`, but the backend sends
// an `images` array. We now pass the entire `images` array to
// `ProductItem`, which handles arrays or strings gracefully.
const LatestCollection = () => {
  const { products, productPagination, loadNextProductsPage } = useContext(ShopContext);
  const [latestProducts, setLatestProducts] = useState([]);

  useEffect(() => {
    setLatestProducts(products.slice(0, 10));
  }, [products]);

  useEffect(() => {
    if (!productPagination?.hasMore) return;
    if (products.length >= 10) return;
    loadNextProductsPage();
  }, [products.length, productPagination?.hasMore, loadNextProductsPage]);
  
  return (
    <div className='my-10'>
       <div className='text-center py-8 text-3xl'>
         <Title text1={'LATEST'} text2={'COLLECTIONS'} />
         <p className='w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600'>
          Discover the newest styles and trends curated by TinyMillion - where fashion meets individuality.
          </p>
        </div>
      {/* Rendering Products */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
        {latestProducts.map((item, index) => (
          <ProductItem
            key={index}
            id={item._id}
            image={getProductImageArray(item)}
            name={item.name}
            price={item.price}
          />
        ))}
      </div>
    </div>
  );
};

export default LatestCollection;