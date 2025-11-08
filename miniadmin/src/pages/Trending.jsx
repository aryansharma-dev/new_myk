import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../lib/api'

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/240?text=Product'

const Trending = () => {
  const [products, setProducts] = useState([])
  const [myIds, setMyIds] = useState(() => new Set())
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')

  const fetchTrending = useCallback(async () => {
    setLoading(true)
    try {
      let res = await api.get('/api/product/trending').catch(() => null)
      if (!res || !res.data) {
        res = await api.get('/api/product/list')
      }
      const data = res?.data?.products || res?.data?.data?.products || []
      setProducts(data || [])
    } catch (error) {
      console.error('Trending fetch error:', error)
      toast.error('Unable to load trending products')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMyProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem('subadmin_token')
      const res = await api.get('/api/subadmin/mystore/products', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.data && res.data.products) {
        setMyIds(new Set(res.data.products.map((product) => product._id)))
      }
    } catch (error) {
      console.error('fetch my products error:', error)
    }
  }, [])

  useEffect(() => {
    fetchTrending()
    fetchMyProducts()
  }, [fetchMyProducts, fetchTrending])

  useEffect(() => {
    document.title = 'Latest Collection - TinyMillion Mini Admin'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = 'Browse trending and bestselling products and add them to your mini store.'
  }, [])

  const addToStore = async (productId) => {
    try {
      const token = localStorage.getItem('subadmin_token')
      const res = await api.post(
        '/api/subadmin/mystore/products',
        { productId },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (res.data && res.data.success) {
        toast.success('Added to your store')
        setMyIds((current) => new Set([...Array.from(current), productId]))
      } else {
        toast.error(res.data?.message || 'Failed to add')
      }
    } catch (error) {
      console.error('Add to store error:', error)
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => !category || product.category === category)
    return filtered.sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price
      if (sort === 'price_desc') return b.price - a.price
      return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
    })
  }, [category, products, sort])

  const categories = useMemo(
    () => Array.from(new Set((products || []).map((product) => product.category).filter(Boolean))),
    [products],
  )

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Latest Collection</h1>
          <p className="text-sm text-gray-600">Bestsellers and trending products</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="px-3 py-2 border rounded">
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="px-3 py-2 border rounded">
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
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white border rounded overflow-hidden">
              <img
                src={product.images?.[0] || product.image?.[0] || PLACEHOLDER_IMAGE}
                className="w-full h-44 object-cover"
                alt={product.name}
                onError={(event) => {
                  event.target.src = PLACEHOLDER_IMAGE
                }}
              />
              <div className="p-3">
                <div className="text-sm font-medium line-clamp-2">{product.name}</div>
                <div className="text-sm text-gray-600">{product.category}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="font-semibold">₹{product.price}</div>
                  <button
                    disabled={myIds.has(product._id)}
                    onClick={() => addToStore(product._id)}
                    className={`px-3 py-1 rounded text-sm ${myIds.has(product._id) ? 'bg-gray-300 text-gray-700' : 'bg-black text-white'}`}
                  >
                    {myIds.has(product._id) ? 'In Store' : 'Add to My Store'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Trending