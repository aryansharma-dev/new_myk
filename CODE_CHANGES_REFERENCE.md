# Code Changes Reference

## 1. Frontend: miniadmin/src/pages/ProductForm.jsx

### State Changes
```javascript
// BEFORE:
const [form, setForm] = useState({
  name: '', description: '', price: '', 
  category: '', subCategory: '', stock: '',
  bestseller: false, sizes: [], images: []
})

// AFTER:
const [form, setForm] = useState({
  name: '', description: '', price: '',
  category: '', subCategory: '', stock: '',
  bestseller: false, sizes: [],
})

const [imageFiles, setImageFiles] = useState([null, null, null, null])
const [imageUrls, setImageUrls] = useState([])
```

### Image Upload Handler
```javascript
// BEFORE: Uploaded immediately to /api/upload
const handleImageUpload = async (e, index) => {
  const file = e.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('image', file)
  try {
    setUploading(true)
    const res = await api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const imageUrl = res.data?.url
    if (imageUrl) {
      const updatedImages = [...form.images]
      updatedImages[index] = imageUrl
      setForm((prev) => ({ ...prev, images: updatedImages }))
    }
  } catch (error) {
    toast.error('Image upload failed')
  }
}

// AFTER: Store file locally, upload with form submission
const handleImageUpload = (e, index) => {
  const file = e.target.files[0]
  if (!file) return

  const updatedFiles = [...imageFiles]
  updatedFiles[index] = file
  setImageFiles(updatedFiles)

  const reader = new FileReader()
  reader.onloadend = () => {
    const updatedUrls = [...imageUrls]
    updatedUrls[index] = reader.result
    setImageUrls(updatedUrls)
  }
  reader.readAsDataURL(file)
  toast.success('Image selected successfully')
}
```

### Form Submission
```javascript
// BEFORE: Sent only JSON data
const onSubmit = async (e) => {
  const payload = { ...form }
  const res = await api.post('/api/subadmin/mystore/products/create', payload, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

// AFTER: Sends FormData with files
const onSubmit = async (e) => {
  const formData = new FormData()
  formData.append('name', form.name)
  formData.append('description', form.description)
  formData.append('price', form.price)
  formData.append('category', form.category)
  formData.append('subCategory', form.subCategory)
  formData.append('stock', form.stock || 0)
  formData.append('bestseller', form.bestseller)

  if (form.sizes.length > 0) {
    formData.append('sizes', JSON.stringify(form.sizes))
  }

  imageFiles.forEach((file, index) => {
    if (file !== null) {
      formData.append(`image${index + 1}`, file)
    }
  })

  const endpoint = productId 
    ? `/api/subadmin/mystore/products/${productId}` 
    : '/api/subadmin/mystore/products/create'

  const res = await api.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  })
}
```

### Validation
```javascript
// BEFORE:
if (form.images.length === 0) 
  validationErrors.images = 'Please upload at least one image'

// AFTER:
const hasImages = imageFiles.some((f) => f !== null) || 
  imageUrls.some((u) => u && !u.startsWith('data:'))
if (!hasImages) 
  validationErrors.images = 'Please upload at least one image'
```

---

## 2. Backend: backend/routes/subadminRoutes.js

### Imports
```javascript
// ADDED:
import upload from "../middleware/multer.js";
```

### Routes
```javascript
// BEFORE:
router.post("/mystore/products/create", isSubAdmin, createNewProduct);
router.put('/mystore/products/:productId', isSubAdmin, updateMyProduct);

// AFTER:
router.post(
  "/mystore/products/create",
  isSubAdmin,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  createNewProduct
);

router.put(
  '/mystore/products/:productId',
  isSubAdmin,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  updateMyProduct
);
```

---

## 3. Backend: backend/controllers/subadminController.js

### Imports
```javascript
// ADDED:
import { v2 as cloudinary } from "cloudinary";
```

### createNewProduct Function
```javascript
// ADDED FILE UPLOAD HANDLING:

// Upload files from multer (image1, image2, image3, image4)
const uploadedUrls = [];
for (let i = 1; i <= 4; i++) {
  const file = req.files?.[`image${i}`]?.[0];
  if (file) {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image", folder: "products" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });
    if (uploadResult?.secure_url) {
      uploadedUrls.push(uploadResult.secure_url);
    }
  }
}

// Combine body images and uploaded images
const allImages = [...imagesArr, ...uploadedUrls].filter(Boolean);

if (allImages.length === 0) {
  return res.status(400).json({ 
    success: false, 
    message: "At least one image is required" 
  });
}

// Use allImages instead of imagesArr
const newProduct = await productModel.create({
  name: String(name).trim(),
  description: String(description).trim(),
  price: Number(price),
  category: String(category).trim(),
  subCategory: String(subCategory).trim(),
  sizes: sizesArr.length ? sizesArr : [],
  images: allImages,  // ← Changed from imagesArr
  stock: Number(stock) || 0,
  bestseller: bestsellerFlag,
  date: now
});
```

### updateMyProduct Function
```javascript
// ADDED FILE UPLOAD HANDLING:

// Handle file uploads
const uploadedUrls = [];
for (let i = 1; i <= 4; i++) {
  const file = req.files?.[`image${i}`]?.[0];
  if (file) {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image", folder: "products" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });
    if (uploadResult?.secure_url) {
      uploadedUrls.push(uploadResult.secure_url);
    }
  }
}

// ... existing code to apply updates ...

// If new files were uploaded, merge them with existing images
if (uploadedUrls.length > 0) {
  product.images = [...(product.images || []), ...uploadedUrls];
}

await product.save();
```

---

## 4. Product Model (No Changes Needed)

The model already has the images field:
```javascript
images: { type: [String], required: true },
```

This is sufficient for storing Cloudinary secure URLs.

---

## Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| **Upload Strategy** | Immediate per file | Batch on form submit |
| **Upload Endpoint** | `/api/upload` (doesn't exist) | `/api/subadmin/mystore/products/create` |
| **Request Type** | JSON | FormData (multipart) |
| **File Field Names** | Single "image" | "image1", "image2", etc. |
| **Image Storage** | Form state | imageFiles (for submission) + imageUrls (for preview) |
| **Authorization** | Not checked | isSubAdmin middleware |
| **Update Behavior** | Full replacement | Append new images |

---

## Testing Endpoints

### Create Product
```bash
curl -X POST http://localhost:4000/api/subadmin/mystore/products/create \
  -H "Authorization: Bearer <token>" \
  -F "name=T-Shirt" \
  -F "description=Cotton T-Shirt" \
  -F "price=499" \
  -F "category=Men" \
  -F "subCategory=Topwear" \
  -F "sizes=[\"S\",\"M\",\"L\"]" \
  -F "stock=50" \
  -F "bestseller=false" \
  -F "image1=@/path/to/image1.jpg" \
  -F "image2=@/path/to/image2.jpg"
```

### Update Product
```bash
curl -X PUT http://localhost:4000/api/subadmin/mystore/products/productId \
  -H "Authorization: Bearer <token>" \
  -F "name=Updated T-Shirt" \
  -F "price=599" \
  -F "image3=@/path/to/image3.jpg"
```

---

**Last Updated**: November 12, 2025
