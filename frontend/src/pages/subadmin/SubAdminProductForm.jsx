import { useState, useEffect } from 'react'; // Fixed: remove unused default React import flagged by eslint.
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { toast } from 'react-toastify';

const SubAdminProductForm = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subCategory: '',
    sizes: '',
    images: '',
    stock: '',
    bestseller: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = 'Create Product - Sub Admin';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = 'Create a new product for your TinyMillion mini store.';
  }, []);

  useEffect(() => {
    if (!productId) return;
    // Fetch product for edit
    (async () => {
      try {
        const token = localStorage.getItem('subadmin_token');
        const res = await api.post('/api/product/single', { productId }, { headers: { Authorization: `Bearer ${token}` } });
        const product = res.data?.product || res.data?.data?.product;
        if (product) {
          setForm({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            category: product.category || '',
            subCategory: product.subCategory || '',
            sizes: (product.sizes || []).join(','),
            images: (product.images || []).join(','),
            stock: product.stock || '',
            bestseller: !!product.bestseller,
          });
        }
      } catch (err) {
        console.error('Fetch product for edit error:', err);
        toast.error('Failed to load product for editing');
      }
    })();
  }, [productId]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.price || Number(form.price) <= 0) e.price = 'Price must be a positive number';
    if (!form.category.trim()) e.category = 'Category is required';
    if (!form.subCategory.trim()) e.subCategory = 'Sub category is required';
    if (!form.images.trim()) e.images = 'Provide at least one image URL (comma separated)';
    return e;
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('subadmin_token');
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category.trim(),
        subCategory: form.subCategory.trim(),
        sizes: form.sizes, // backend will parse
        images: form.images, // comma separated
        stock: Number(form.stock) || 0,
        bestseller: !!form.bestseller,
      };

      let res;
      if (productId) {
        // Update
        res = await api.put(`/api/subadmin/mystore/products/${productId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        res = await api.post('/api/subadmin/mystore/products/create', payload, { headers: { Authorization: `Bearer ${token}` } });
      }

      if (res.data && res.data.success) {
        toast.success(productId ? 'Product updated' : 'Product created and added to your store');
        navigate('/subadmin/products');
      } else {
        toast.error(res.data?.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Create product error:', error);
      const message = error?.response?.data?.message || error.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow rounded p-6">
      <h2 className="text-2xl font-bold mb-4">Create New Product</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input name="name" value={form.name} onChange={onChange} className="mt-1 block w-full border rounded p-2" />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea name="description" value={form.description} onChange={onChange} className="mt-1 block w-full border rounded p-2 h-28" />
          {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input name="price" value={form.price} onChange={onChange} type="number" step="0.01" className="mt-1 block w-full border rounded p-2" />
            {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input name="stock" value={form.stock} onChange={onChange} type="number" className="mt-1 block w-full border rounded p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bestseller</label>
            <div className="mt-1">
              <label className="inline-flex items-center">
                <input type="checkbox" name="bestseller" checked={form.bestseller} onChange={onChange} className="mr-2" />
                <span className="text-sm">Mark as bestseller</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input name="category" value={form.category} onChange={onChange} className="mt-1 block w-full border rounded p-2" />
            {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sub Category</label>
            <input name="subCategory" value={form.subCategory} onChange={onChange} className="mt-1 block w-full border rounded p-2" />
            {errors.subCategory && <p className="text-sm text-red-600 mt-1">{errors.subCategory}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Sizes (comma separated)</label>
          <input name="sizes" value={form.sizes} onChange={onChange} placeholder="S,M,L or Small,Medium,Large" className="mt-1 block w-full border rounded p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Image URLs (comma separated)</label>
          <textarea name="images" value={form.images} onChange={onChange} placeholder="https://... , https://..." className="mt-1 block w-full border rounded p-2 h-24" />
          {errors.images && <p className="text-sm text-red-600 mt-1">{errors.images}</p>}
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={() => navigate(-1)} className="mr-3 px-4 py-2 border rounded">Cancel</button>
          <button type="submit" disabled={loading} className="px-5 py-2 bg-black text-white rounded">
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubAdminProductForm;

