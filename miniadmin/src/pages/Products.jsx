import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../lib/api'
import ShopContext from '../context/ShopContextInstance'

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300?text=Product'

const Products = () => {
  const { products: allProducts, currency } = useContext(ShopContext)
  const [myProducts, setMyProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const fetchMyProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem('subadmin_token')
      const response = await api.get('/api/subadmin/mystore/products', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const productsFromResponse = response?.data?.products || response?.data?.data?.products || response?.data?.data || []
      if (response?.data?.success) {
        setMyProducts(Array.isArray(productsFromResponse) ? productsFromResponse : [])
      } else {
        toast.error(response?.data?.message || 'Failed to load products')
      }
    } catch (error) {
      console.error('Fetch products error:', error)
      const message = error?.response?.data?.message || error.message
      toast.error(message)

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        localStorage.removeItem('subadmin_token')
        localStorage.removeItem('subadmin_user')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchMyProducts()
  }, [fetchMyProducts])

  useEffect(() => {
    document.title = 'Products - TinyMillion Mini Admin'
  }, [])

  const addProductToStore = async (productId) => {
    try {
      const token = localStorage.getItem('subadmin_token')

      const response = await api.post(
        '/api/subadmin/mystore/products',
        { productId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data.success) {
        toast.success('Product added to your store!')
        fetchMyProducts()
        setShowAddModal(false)
      } else {
        toast.error(response.data.message || 'Failed to add product')
      }
    } catch (error) {
      console.error('Add product error:', error)
      const message = error?.response?.data?.message || error.message
      toast.error(message)
    }
  }

  const removeProductFromStore = async (productId) => {
    if (!confirm('Remove this product from your store?')) return

    try {
      const token = localStorage.getItem('subadmin_token')
      
      const response = await api.delete(`/api/subadmin/mystore/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        toast.success(response.data.message || 'Product removed from your store')
        fetchMyProducts()
      } else {
        toast.error(response.data.message || 'Failed to remove product')
      }
    } catch (error) {
      console.error('Remove product error:', error)
      const message = error?.response?.data?.message || error.message
      toast.error(message)
    }
  }

  const editProduct = (productId) => {
    navigate(`/products/edit/${productId}`)
  }

  const myProductIds = useMemo(() => new Set(myProducts.map((product) => product._id)), [myProducts])
  const availableProducts = useMemo(
    () => allProducts.filter((product) => !myProductIds.has(product._id)),
    [allProducts, myProductIds],
  )

  const filteredAvailableProducts = availableProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">Manage products in your store</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products/create')}
            className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            + Create New Product
          </button>
          
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap- mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-2xl font-bold text-gray-900">{myProducts.length}</div>
          <div className="text-sm text-gray-600 mt-1">Products in Store</div>
        </div>
        </div>

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
                    src={product.images?.[0] || product.image?.[0] || PLACEHOLDER_IMAGE}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(event) => {
                      event.target.src = PLACEHOLDER_IMAGE
                    }}
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
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-semibold">
                      {currency}
                      {product.price}
                    </span>
                    <button
                      onClick={() => editProduct(product._id)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      
    </div>
  )
}

export default Products