import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../lib/api';
import ShopContext from '../../context/ShopContextInstance';

const SubAdminProducts = () => {
  const { products: allProducts, currency } = useContext(ShopContext);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = async () => {
    try {
      const token = localStorage.getItem('subadmin_token');
      console.log('[SubAdminProducts] Token exists:', !!token);
      const response = await api.get('/api/subadmin/mystore/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('[SubAdminProducts] API Response:', response?.data);
      const productsFromResponse = response?.data?.products || response?.data?.data?.products || response?.data?.data || [];
      if (response?.data?.success) {
        setMyProducts(Array.isArray(productsFromResponse) ? productsFromResponse : []);
      } else {
        toast.error(response?.data?.message || 'Failed to load products');
      }
    } catch (error) {
      console.error('Fetch products error:', error);
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
  };

  const addProductToStore = async (productId) => {
    try {
      const token = localStorage.getItem('subadmin_token');
      
      const response = await api.post('/api/subadmin/mystore/products', 
        { productId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Product added to your store!');
        fetchMyProducts();
        setShowAddModal(false);
      } else {
        toast.error(response.data.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Add product error:', error);
      const message = error?.response?.data?.message || error.message;
      toast.error(message);
    }
  };

  const removeProductFromStore = async (productId) => {
    if (!confirm('Remove this product from your store?')) return;

    try {
      const token = localStorage.getItem('subadmin_token');
      
      const response = await api.delete(`/api/subadmin/mystore/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('[SubAdminProducts] delete response:', response?.data);
      if (response.data.success) {
        toast.success(response.data.message || 'Product removed from your store');
        fetchMyProducts();
      } else {
        toast.error(response.data.message || 'Failed to remove product');
      }
    } catch (error) {
      console.error('Remove product error:', error);
      const message = error?.response?.data?.message || error.message;
      toast.error(message);
    }
  };

  const editProduct = (productId) => {
    navigate(`/subadmin/products/edit/${productId}`);
  };

  const myProductIds = new Set(myProducts.map(p => p._id));
  const availableProducts = allProducts.filter(p => !myProductIds.has(p._id));

  const filteredAvailableProducts = availableProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">Manage products in your store</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/subadmin/products/create')}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            + Create New Product
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
          >
            Add From Catalog
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-gray-900">{myProducts.length}</div>
          <div className="text-sm text-gray-600 mt-1">Products in Store</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-gray-900">{allProducts.length}</div>
          <div className="text-sm text-gray-600 mt-1">Available Products</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-gray-900">{availableProducts.length}</div>
          <div className="text-sm text-gray-600 mt-1">Can Be Added</div>
        </div>
      </div>

      {/* My Products Grid */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Store Products</h2>
        
        {myProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-600 mb-4">No products in your store yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {myProducts.map((product) => (
              <div key={product._id} className="border rounded-lg overflow-hidden hover:shadow-lg transition group">
                <div className="relative">
                  <img
                    src={product.images?.[0] || product.image?.[0] || '/placeholder.png'}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => editProduct(product._id)}
                      title="Edit product"
                      className="bg-white text-gray-800 p-2 rounded-full shadow"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => removeProductFromStore(product._id)}
                      title="Remove product"
                      className="bg-red-600 text-white p-2 rounded-full shadow"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-gray-900">
                    {currency}{product.price}
                  </p>
                  {product.category && (
                    <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Add Product to Store</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTerm('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Products Grid */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {filteredAvailableProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    {searchTerm ? 'No products found' : 'All products already added to your store'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredAvailableProducts.map((product) => (
                    <div key={product._id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                      <img
                        src={product.image?.[0] || '/placeholder.png'}
                        alt={product.name}
                        className="w-full h-40 object-cover"
                      />
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                          {product.name}
                        </h3>
                        <p className="text-base font-bold text-gray-900 mb-2">
                          {currency}{product.price}
                        </p>
                        <button
                          onClick={() => addProductToStore(product._id)}
                          className="w-full px-3 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 transition"
                        >
                          Add to Store
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAdminProducts;
