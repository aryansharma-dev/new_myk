import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../lib/api'

const Dashboard = () => {
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchStoreData = useCallback(async () => {
    try {
      const token = localStorage.getItem('subadmin_token')

      const response = await api.get('/api/subadmin/mystore', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const storeFromResponse = response?.data?.store || response?.data?.data?.store
      if (response?.data?.success && storeFromResponse) {
        setStore(storeFromResponse)
      } else {
        toast.error(response?.data?.message || 'Failed to load store')
      }
    } catch (error) {
      console.error('Fetch store error:', error)
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
    fetchStoreData()
  }, [fetchStoreData])

  useEffect(() => {
    document.title = 'Dashboard - TinyMillion Mini Admin'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = 'Overview of your TinyMillion mini store performance and quick actions.'
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
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
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-gray-600">
          Manage your store: <span className="font-semibold">{store.displayName}</span>
        </p>
      </div>

      {!store.isActive && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <p className="text-sm text-yellow-800">
              Your store is currently <strong>inactive</strong>. It won&apos;t be visible to customers. Contact the admin to activate it.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Total Products</h3>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{store.products?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Products in your store</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Store Status</h3>
            <span className="text-2xl">{store.isActive ? '✅' : '🔴'}</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {store.isActive ? 'Active' : 'Inactive'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {store.isActive ? 'Your store is live for customers.' : 'Customers cannot view your store right now.'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Orders</h3>
            <span className="text-2xl">🛒</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{store.ordersCount || 0}</p>
          <p className="text-xs text-gray-500 mt-2">Orders containing your products</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/store-settings')}
              className="w-full px-4 py-3 text-left border rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Update store settings</p>
                  <p className="text-sm text-gray-500">Edit your store information and branding</p>
                </div>
                <span>→</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/products')}
              className="w-full px-4 py-3 text-left border rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Manage products</p>
                  <p className="text-sm text-gray-500">Add, edit, or remove products from your store</p>
                </div>
                <span>→</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/orders')}
              className="w-full px-4 py-3 text-left border rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Review orders</p>
                  <p className="text-sm text-gray-500">Track orders that include your products</p>
                </div>
                <span>→</span>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Store Summary</h2>
          <dl className="space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <dt>Store Name</dt>
              <dd className="font-medium">{store.displayName || store.name || 'N/A'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Mini Store Slug</dt>
              <dd className="font-mono text-xs">{store.slug}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Status</dt>
              <dd className="font-medium">{store.isActive ? 'Active' : 'Inactive'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Catalog Size</dt>
              <dd className="font-medium">{store.products?.length || 0} products</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default Dashboard