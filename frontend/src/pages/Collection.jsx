import { useContext, useEffect, useMemo, useState } from 'react';
import ShopContext from '../context/ShopContextInstance';
import { assets } from '../assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';
import { getProductImageArray } from '../utils/productImages';
import usePageMetadata from '../hooks/usePageMetadata';

const Collection = () => {
  const { products, search, showSearch, productPagination, loadNextProductsPage } = useContext(ShopContext);

  // UI state
  const [showFilter, setShowFilter] = useState(false); // mobile toggle
  // filters
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);

  // sorting
  const [sortType, setSortType] = useState('relavent'); // keep value as before

  // toggle helper for checkbox groups
  const toggleValue = (value, setter) => {
    setter(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]));
  };

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return [];
    }

    let list = products.filter(item => item && typeof item === 'object' && item._id);

    if (showSearch && search) {
      const q = search.toLowerCase();
      list = list.filter(item => {
        if (!item) return false;
        const name = typeof item.name === 'string' ? item.name.toLowerCase() : '';
        return name.includes(q);
      });
    }

    if (category.length > 0) {
      list = list.filter(item => category.includes(item?.category));
    }

    if (subCategory.length > 0) {
      list = list.filter(item => subCategory.includes(item?.subCategory));
    }

    switch (sortType) {
      case 'low-high':
        return list.slice().sort((a, b) => a.price - b.price);
      case 'high-low':
        return list.slice().sort((a, b) => b.price - a.price);
      default:
        return list;
    }
  }, [products, showSearch, search, category, subCategory, sortType]);

  const collectionStructuredData = useMemo(
    () =>
      ({ absoluteCanonical, pageDescription, baseTitle, origin }) => {
        const listItems = filteredProducts
          .slice(0, 12)
          .map((item, index) => {
            if (!item?._id) return null;
            return {
              '@type': 'ListItem',
              position: index + 1,
              url: `${origin}/product/${item._id}`,
              name: item?.name,
            };
          })
          .filter(Boolean);

        return [
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            '@id': `${absoluteCanonical}#all-products`,
            url: absoluteCanonical,
            name: baseTitle,
            description: pageDescription,
          },
          listItems.length
            ? {
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              '@id': `${absoluteCanonical}#catalogue`,
              itemListElement: listItems,
            }
            : null,
        ].filter(Boolean);
      },
    [filteredProducts]
  );

  useEffect(() => {
    if (!productPagination?.hasMore) return;
    if (!products.length) return;
    if (filteredProducts.length >= 12) return;
    loadNextProductsPage();
  }, [filteredProducts.length, products.length, productPagination?.hasMore, loadNextProductsPage]);

  usePageMetadata({
    title: 'Shop All Collections',
    description:
      'Filter TinyMillion apparel, jewellery, and creator exclusives by category and price to find your next signature outfit.',
    keywords:
      'TinyMillion all products, TinyMillion catalogue, shop outfits online, fashion filters, creator merch',
    canonical: '/collection',
    structuredData: collectionStructuredData,
  });

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t min-h-screen px-4">
      {/* LEFT: Sidebar Filters (desktop fixed, mobile toggle) */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter(!showFilter)}
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
        >
          FILTERS
          <img
            className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`}
            src={assets.dropdown_icon}
            alt="Toggle filter options"
          />
        </p>

        {/* Categories */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 dark:invert ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className="mb-3 text-sm font-medium dark:invert">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700 ">
            {['Men', 'Women', 'Kids', 'Jewellery'].map(c => (
              <label key={c} className="flex gap-2 items-center">
                <input
                  className="w-3"
                  type="checkbox"
                  value={c}
                  checked={category.includes(c)}
                  onChange={e => toggleValue(e.target.value, setCategory)}
                />
                {c}
              </label>
            ))}
          </div>
        </div>

        {/* Types */}
        <div className={`border border-gray-300 pl-5 py-3 my-5 dark:invert ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className="mb-3 text-sm font-medium dark:invert">TYPE</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {['Topwear', 'Bottomwear', 'Winterwear', 'Girlish'].map(sc => (
              <label key={sc} className="flex gap-2 items-center">
                <input
                  className="w-3"
                  type="checkbox"
                  value={sc}
                  checked={subCategory.includes(sc)}
                  onChange={e => toggleValue(e.target.value, setSubCategory)}
                />
                {sc}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Heading + Sort + Products */}
      <div className="flex-1 ">
        <div className="flex justify-between text-base sm:text-2xl mb-4 dark:invert">
          <Title text1={'ALL'} text2={'COLLECTIONS'} />
          <select
            onChange={e => setSortType(e.target.value)}
            className="border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white text-sm px-2 py-1 rounded outline-none"
          >
            <option value="relavent">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6 ">
          {filteredProducts.map((item) => {
            if (!item || !item?._id) {
              return null;
            }

            return (
              <ProductItem
                key={item._id}
                id={item._id}
                name={item.name}
                price={item.price}
                image={getProductImageArray(item)} // backend se images array aa raha hai
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Collection;
