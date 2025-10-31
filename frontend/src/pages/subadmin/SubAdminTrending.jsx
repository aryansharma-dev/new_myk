import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { toast } from 'react-toastify';

const SubAdminTrending = () => {
  const [products, setProducts] = useState([]);
  const [myIds, setMyIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetchTrending();
    fetchMyProducts();
  }, []);

  useEffect(() => {
    document.title = 'Latest Collection - Sub Admin';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = 'Browse trending and bestselling products and add them to your mini store.';
  }, []);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      // try trending endpoint first
      let res = await api.get('/api/product/trending').catch(() => null);
      if (!res || !res.data) {
        // fallback to list and filter
        res = await api.get('/api/product/list');
      }
      const data = res?.data?.products || res?.data?.data?.products || [];
      setProducts(data || []);
    } catch (error) {
      console.error('Trending fetch error:', error);
      toast.error('Unable to load trending products');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProducts = async () => {
    try {
      const token = localStorage.getItem('subadmin_token');
  const res = await api.get('/api/subadmin/mystore/products', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.products) {
        setMyIds(new Set(res.data.products.map(p => p._id)));
      }
    } catch (error) {
      console.error('fetch my products error:', error);
    }
  };

  const addToStore = async (pid) => {
    try {
      const token = localStorage.getItem('subadmin_token');
  const res = await api.post('/api/subadmin/mystore/products', { productId: pid }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && res.data.success) {
        toast.success('Added to your store');
        setMyIds(s => new Set([...Array.from(s), pid]));
      } else {
        toast.error(res.data?.message || 'Failed to add');
      }
    } catch (error) {
      console.error('Add to store error:', error);
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const filtered = products
    .filter(p => !category || p.category === category)
    .sort((a,b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      // newest
      return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
    });

  const categories = Array.from(new Set((products || []).map(p => p.category).filter(Boolean)));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Latest Collection</h1>
          <p className="text-sm text-gray-600">Bestsellers and trending products</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 border rounded">
            <option value="">All categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 border rounded">
            <option value="newest">Newest</option>
            <option value="price_asc">Price - Low to High</option>
            <option value="price_desc">Price - High to Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p._id} className="bg-white border rounded overflow-hidden">
              <img src={p.images?.[0] || p.image?.[0] || '/placeholder.png'} className="w-full h-44 object-cover" alt={p.name} />
              <div className="p-3">
                <div className="text-sm font-medium line-clamp-2">{p.name}</div>
                <div className="text-sm text-gray-600">{p.category}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="font-semibold">₹{p.price}</div>
                  <button disabled={myIds.has(p._id)} onClick={() => addToStore(p._id)} className={`px-3 py-1 rounded text-sm ${myIds.has(p._id) ? 'bg-gray-300 text-gray-700' : 'bg-black text-white'}`}>
                    {myIds.has(p._id) ? 'In Store' : 'Add to My Store'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubAdminTrending;
