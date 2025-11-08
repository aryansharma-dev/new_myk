import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../lib/api'

const STATUS_COLORS = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Initiated: 'bg-yellow-100 text-yellow-800',
  Paid: 'bg-blue-100 text-blue-800',
  Packing: 'bg-indigo-100 text-indigo-800',
  Shipped: 'bg-orange-100 text-orange-800',
  'Out for delivery': 'bg-orange-100 text-orange-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
}

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/200?text=Product'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    document.title = 'Orders - TinyMillion Mini Admin'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = 'Track orders that include products from your mini store.'
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('subadmin_token')
      const params = []
      if (statusFilter) params.push(`status=${encodeURIComponent(statusFilter)}`)
      if (search) params.push(`search=${encodeURIComponent(search)}`)
      const url = `/api/subadmin/mystore/orders${params.length ? '?' + params.join('&') : ''}`
      const res = await api.get(url, { headers: { Authorization: `Bearer ${token}` } })
      const ordersFromResponse = res?.data?.orders || res?.data?.data?.orders || res?.data?.data || []
      if (res.data && res.data.success) {
        setOrders(Array.isArray(ordersFromResponse) ? ordersFromResponse : [])
      } else {
        toast.error(res.data?.message || 'Failed to fetch orders')
      }
    } catch (error) {
      console.error('Fetch orders error:', error)
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const openOrder = (order) => setSelected(order)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-gray-600">Orders that include products from your store</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by order id or customer"
            className="px-3 py-2 border rounded"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="">All status</option>
            <option>Pending</option>
            <option>Initiated</option>
            <option>Paid</option>
            <option>Packing</option>
            <option>Shipped</option>
            <option>Out for delivery</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
          <button onClick={fetchOrders} className="px-4 py-2 bg-black text-white rounded">
            Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="animate-pulse flex items-center gap-4">
              <div className="w-16 h-8 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">No orders found</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow border">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left">
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{String(order._id).slice(-8)}</td>
                  <td className="px-4 py-3">{order.user?.name || order.user?.email || 'Customer'}</td>
                  <td className="px-4 py-3">{(order.cartItems || []).length}</td>
                  <td className="px-4 py-3">₹{order.totalAmount || order.amount}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openOrder(order)} className="px-3 py-1 border rounded">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow max-w-3xl w-full p-6 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Order Details</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500">
                Close
              </button>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                Order ID: <span className="font-mono">{selected._id}</span>
              </div>
              <div className="text-sm">
                Customer: {selected.user?.name} ({selected.user?.email})
              </div>
              <div className="text-sm">
                Status: <strong>{selected.status}</strong>
              </div>
              <div className="mt-4">
                <h4 className="font-medium">Items</h4>
                <div className="mt-2 grid gap-2">
                  {(selected.cartItems || []).map((item, index) => (
                    <div key={index} className="flex items-center gap-3 border rounded p-2">
                      <img
                        src={item.product?.images?.[0] || PLACEHOLDER_IMAGE}
                        className="w-14 h-14 object-cover rounded"
                        alt=""
                        onError={(event) => {
                          event.target.src = PLACEHOLDER_IMAGE
                        }}
                      />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">Qty: {item.quantity} • Size: {item.size}</div>
                      </div>
                      <div className="ml-auto font-semibold">₹{item.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders