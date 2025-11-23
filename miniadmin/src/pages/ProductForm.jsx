import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../lib/api'

const ProductForm = () => {
  const navigate = useNavigate()
  const { productId } = useParams()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subCategory: '',
    stock: '',
    bestseller: false,
    sizes: [],
  })

  const [imageFiles, setImageFiles] = useState([null, null, null, null])
  const [imageUrls, setImageUrls] = useState([])
  const [errors, setErrors] = useState({})

  const categories = ['Men', 'Women', 'Kids']
  const subCategories = ['Topwear', 'Bottomwear', 'Footwear', 'Accessories']
  const availableSizes = ['S', 'M', 'L', 'XL', 'XXL']

  // Fetch product for editing if productId is given
  useEffect(() => {
    if (!productId) return
      ; (async () => {
        try {
          const token = localStorage.getItem('subadmin_token')
          const res = await api.post(
            '/api/product/single',
            { productId },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          const product = res.data?.product || res.data?.data?.product
          if (product) {
            setForm({
              name: product.name || '',
              description: product.description || '',
              price: product.price || '',
              category: product.category || '',
              subCategory: product.subCategory || '',
              stock: product.stock || '',
              bestseller: !!product.bestseller,
              sizes: product.sizes || [],
            })
            setImageUrls(product.images || [])
          }
        } catch (error) {
          toast.error('Failed to load product for editing')
        }
      })()
  }, [productId])

  const handleDeleteImage = (index) => {
    const updated = [...imageUrls];
    updated[index] = null;
    setImageUrls(updated);
  };

  const handleEditImage = (index) => {
  const input = document.getElementById(`upload-${index}`);
  if (input) input.click();
};



  // Handle image file selection
  const handleImageUpload = (e, index) => {
    const file = e.target.files[0]
    if (!file) return

    const updatedFiles = [...imageFiles]
    updatedFiles[index] = file
    setImageFiles(updatedFiles)

    // Preview image URL
    const reader = new FileReader()
    reader.onloadend = () => {
      const updatedUrls = [...imageUrls]
      updatedUrls[index] = reader.result
      setImageUrls(updatedUrls)
    }
    reader.readAsDataURL(file)

    toast.success('Image selected successfully')
  }

  const toggleSize = (size) => {
    setForm((prev) => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size]
      return { ...prev, sizes }
    })
  }

  const validate = () => {
    const validationErrors = {}
    if (!form.name.trim()) validationErrors.name = 'Product name is required'
    if (!form.description.trim()) validationErrors.description = 'Description is required'
    if (!form.price || Number(form.price) <= 0) validationErrors.price = 'Price must be positive'
    if (!form.category.trim()) validationErrors.category = 'Category is required'
    if (!form.subCategory.trim()) validationErrors.subCategory = 'Subcategory is required'
    const hasImages = imageFiles.some((f) => f !== null) || imageUrls.some((u) => u && !u.startsWith('data:'))
    if (!hasImages) validationErrors.images = 'Please upload at least one image'
    return validationErrors
  }

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) return

    setLoading(true)
    try {
      const token = localStorage.getItem('subadmin_token')

      // Create FormData for multipart/form-data request
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('price', form.price)
      formData.append('category', form.category)
      formData.append('subCategory', form.subCategory)
      formData.append('stock', form.stock || 0)
      formData.append('bestseller', form.bestseller)

      // Append size array as JSON string
      if (form.sizes.length > 0) {
        formData.append('sizes', JSON.stringify(form.sizes))
      }

      // Append image files (image1, image2, image3, image4)
      imageFiles.forEach((file, index) => {
        if (file !== null) {
          formData.append(`image${index + 1}`, file)
        }
      })

      let res
      const endpoint = productId
        ? `/api/subadmin/mystore/products/${productId}`
        : '/api/subadmin/mystore/products/create'
      const method = productId ? 'put' : 'post'

      if (method === 'post') {
        res = await api.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        })
      } else {
        res = await api.put(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        })
      }

      if (res.data?.success) {
        toast.success(productId ? 'Product updated' : 'Product created successfully')
        navigate('/products')
      } else {
        toast.error(res.data?.message || 'Something went wrong')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }
  const handleDescriptionChange = (e) => {
    const words = e.target.value.trim().split(/\s+/);

    if (words.length <= 150) {
      onChange(e);
    }
  };


  return (
    <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-8 mt-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {productId ? 'Edit Product' : 'Add New Product'}
      </h2>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Images
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition"
              >
                <input
                      type="file"
                      id={`upload-${i}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, i)}
                    />
                {imageUrls[i] ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={imageUrls[i]}
                      alt="Uploaded"
                      className="w-full h-28 object-cover rounded"
                    />

                    {/* Buttons under image */}
                    <div className="flex gap-4 mt-2">

                      {/* Delete Button */}
                      <button
                      type="button"
                        onClick={() => handleDeleteImage(i)}
                        className="p-2 rounded-full border border-gray-300 hover:bg-red-100 transition"
                      >
                        <span className="text-xl">🗑️</span>
                      </button>

                      {/* Edit Button */}
                      <button
                      type="button"
                        onClick={() => handleEditImage(i)}
                        className="p-2 rounded-full border border-gray-300 hover:bg-blue-100 transition"
                      >
                        <span className="text-xl">✏️</span>
                      </button>

                    </div>
                  </div>
                ) : (

                  <>
                    <label
                      htmlFor={`upload-${i}`}
                      className="flex flex-col items-center justify-center text-gray-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V8m0 0L3 12m4-4l4 4m6 4v-8m0 0l4 4m-4-4l-4 4"
                        />
                      </svg>
                      Upload
                    </label>
                    
                  </>
                )}
              </div>
            ))}
          </div>
          {errors.images && <p className="text-sm text-red-600 mt-2">{errors.images}</p>}
        </div>

        {/* Product Name & Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="mt-1 block w-full border rounded-lg p-2"
          />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Product Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleDescriptionChange}
            className="mt-1 block w-full border rounded-lg p-2 h-24"
          />
          <p className="text-xs text-gray-500 mt-1">
            {form.description.trim() === ""
              ? 0
              : form.description.trim().split(/\s+/).length}
            /150 words
          </p>
          {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
        </div>

        {/* Category & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={onChange}
              className="mt-1 block w-full border rounded-lg p-2"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sub Category</label>
            <select
              name="subCategory"
              value={form.subCategory}
              onChange={onChange}
              className="mt-1 block w-full border rounded-lg p-2"
            >
              <option value="">Select Sub Category</option>
              {subCategories.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.subCategory && <p className="text-sm text-red-600 mt-1">{errors.subCategory}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={onChange}
              className="mt-1 block w-full border rounded-lg p-2 nospinner"
            />
            {errors.price && <p className="text-sm text-red-600 mt-1">{errors.price}</p>}
          </div>
        </div>

        {/* Sizes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Sizes
          </label>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`px-3 py-1 border rounded-lg ${form.sizes.includes(size)
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Stock & Bestseller */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input
              name="stock"
              value={form.stock}
              onChange={onChange}
              type="number"
              className="mt-1 block w-full border rounded-lg p-2 nospinner"
            />
          </div>

          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              name="bestseller"
              checked={form.bestseller}
              onChange={onChange}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Add to Bestseller</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-black text-white rounded-lg"
          >
            {loading
              ? productId
                ? 'Updating...'
                : 'Creating...'
              : productId
                ? 'Update Product'
                : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
