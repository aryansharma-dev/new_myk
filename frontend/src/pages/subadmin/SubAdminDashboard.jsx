import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../lib/api';

const SubAdminDashboard = () => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStoreData = useCallback(async () => {
    try {
      const token = localStorage.getItem('subadmin_token');

      const response = await api.get('/api/subadmin/mystore', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const storeFromResponse = response?.data?.store || response?.data?.data?.store;
      if (response?.data?.success && storeFromResponse) {
        setStore(storeFromResponse);
      } else {
        toast.error(response?.data?.message || 'Failed to load store');
      }
    } catch (error) {
      console.error('Fetch store error:', error);
      const message = error?.response?.data?.message || error.message;
      toast.error(message);

      // If unauthorized, redirect to login
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        localStorage.removeItem('subadmin_token');
        localStorage.removeItem('subadmin_user');
        navigate('/subadmin/login');
      }
    } finally {
      setLoading(false);
    }
  // Fixed: wrap fetchStoreData with useCallback so useEffect dependency stays stable.
  }, [navigate]);

  useEffect(() => {
    fetchStoreData();
    // Fixed: include fetchStoreData dependency to satisfy React Hooks lint rule.
  }, [fetchStoreData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No store found</p>
        <button
          onClick={fetchStoreData}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-gray-600">
          Manage your store: <span className="font-semibold">{store.displayName}</span>
        </p>
      </div>

      {/* Store Status Alert */}
      {!store.isActive && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <p className="text-sm text-yellow-800">
              {/* Fixed: escape apostrophe to satisfy react/no-unescaped-entities rule. */}
              Your store is currently <strong>inactive</strong>. It won&apos;t be visible to customers. Contact the admin to activate it.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Total Products</h3>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{store.products?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Products in your store</p>
        </div>

        {/* Store Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Store Status</h3>
            <span className="text-2xl">{store.isActive ? '✅' : '🔴'}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {store.isActive ? 'Active' : 'Inactive'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {store.isActive ? 'Visible to customers' : 'Hidden from customers'}
          </p>
        </div>

        {/* Store Views */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Store Link</h3>
            <span className="text-2xl">🔗</span>
          </div>
          <a
            href={`https://tinymillion.com/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm break-all"
          >
            tinymillion.com/{store.slug}
          </a>
          <p className="text-xs text-gray-500 mt-2">Your store URL</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/subadmin/store-settings')}
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition text-left"
          >
            <span className="text-2xl">⚙️</span>
            <div>
              <h3 className="font-medium text-gray-900">Update Store Settings</h3>
              <p className="text-xs text-gray-600">Change name, bio, images</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/subadmin/products')}
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition text-left"
          >
            <span className="text-2xl">📦</span>
            <div>
              <h3 className="font-medium text-gray-900">Manage Products</h3>
              <p className="text-xs text-gray-600">Add or remove products</p>
            </div>
          </button>
        </div>
      </div>

      {/* Store Preview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Store Preview</h2>
        
        {/* Banner */}
        {store.bannerUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={store.bannerUrl}
              alt="Store Banner"
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Store Info */}
        <div className="flex items-center gap-4 mb-4">
          {store.avatarUrl && (
            <img
              src={store.avatarUrl}
              alt="Store Avatar"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{store.displayName}</h3>
            {store.bio && (
              <p className="text-sm text-gray-600 mt-1">{store.bio}</p>
            )}
          </div>
        </div>

        {/* View Store Button */}
        <a
          href={`https://tinymillion.com/${store.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          View Live Store →
        </a>
      </div>
    </div>
  );
};

export default SubAdminDashboard;