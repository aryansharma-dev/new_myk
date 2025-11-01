import { useCallback, useEffect, useState } from 'react'; // Fixed: remove unused default React import as per eslint report.
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../lib/api';

const SubAdminStoreSettings = () => {
  const [store, setStore] = useState(null);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatarUrl: '',
    bannerUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchStoreData = useCallback(async () => {
    try {
      const token = localStorage.getItem('subadmin_token');

      const response = await api.get('/api/subadmin/mystore', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const storeData = response?.data?.store || response?.data?.data?.store;
      if (response?.data?.success && storeData) {
        setStore(storeData);
        setFormData({
          displayName: storeData.displayName || '',
          bio: storeData.bio || '',
          avatarUrl: storeData.avatarUrl || '',
          bannerUrl: storeData.bannerUrl || ''
        });
      } else {
        toast.error(response?.data?.message || 'Failed to load store data');
      }
    } catch (error) {
      console.error('Fetch store error:', error);
      const message = error?.response?.data?.message || error.message;
      toast.error(message);

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        localStorage.removeItem('subadmin_token');
        localStorage.removeItem('subadmin_user');
        navigate('/subadmin/login');
      }
    } finally {
      setLoading(false);
    }
  // Fixed: memoize fetchStoreData so useEffect dependency warning is resolved.
  }, [navigate]);

  useEffect(() => {
    fetchStoreData();
    // Fixed: include fetchStoreData dependency to satisfy exhaustive-deps lint rule.
  }, [fetchStoreData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('subadmin_token');
      
      const response = await api.put('/api/subadmin/mystore', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success('Store updated successfully!');
        setStore(response.data.store);
      } else {
        toast.error(response.data.message || 'Failed to update store');
      }
    } catch (error) {
      console.error('Update store error:', error);
      const message = error?.response?.data?.message || error.message;
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Store Settings</h1>
        <p className="text-gray-600">Update your store information and appearance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-6">
              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name *
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Gopal Fashion Store"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This will be displayed to customers</p>
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Store Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell customers about your store..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Avatar URL */}
              <div>
                <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar Image URL
                </label>
                <input
                  type="url"
                  id="avatarUrl"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Profile image for your store (square image recommended)
                </p>
              </div>

              {/* Banner URL */}
              <div>
                <label htmlFor="bannerUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Image URL
                </label>
                <input
                  type="url"
                  id="bannerUrl"
                  name="bannerUrl"
                  value={formData.bannerUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/banner.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cover image for your store (wide image recommended, 1200x400px)
                </p>
              </div>

              {/* Store Info (Read-only) */}
              <div className="pt-6 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Store Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Store URL:</span>
                    <a
                      href={`https://tinymillion.com/${store?.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      tinymillion.com/{store?.slug}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${store?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {store?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Products:</span>
                    <span className="font-medium">{store?.products?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={fetchStoreData}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            
            {/* Banner Preview */}
            {formData.bannerUrl && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={formData.bannerUrl}
                  alt="Banner Preview"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Avatar + Name Preview */}
            <div className="flex items-center gap-3 mb-4">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="Avatar Preview"
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName)}&background=random`;
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-bold">
                  {formData.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {formData.displayName || 'Store Name'}
                </p>
                <p className="text-xs text-gray-500">
                  {store?.slug}
                </p>
              </div>
            </div>

            {/* Bio Preview */}
            {formData.bio && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {formData.bio}
                </p>
              </div>
            )}

            {/* Info */}
            <div className="text-xs text-gray-500 pt-4 border-t">
              <p>This is how your store will appear to customers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubAdminStoreSettings;