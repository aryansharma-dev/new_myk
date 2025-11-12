# 🏗️ Architecture Diagram: Product Image Upload System

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE (Browser)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │        MINIADMIN: ProductForm.jsx Component                  │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │ State Management:                                      │  │   │
│  │  │  • form: { name, price, category, ... }              │  │   │
│  │  │  • imageFiles: [File|null, File|null, ...]           │  │   │
│  │  │  • imageUrls: [DataURL|URL, ...]  (for preview)      │  │   │
│  │  │  • errors: { field: "error message" }                │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │                                                                 │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │ User Interactions:                                     │  │   │
│  │  │  1. Select Images (1-4) from computer                 │  │   │
│  │  │     → handleImageUpload() stores in imageFiles        │  │   │
│  │  │     → Shows preview as DataURL in imageUrls           │  │   │
│  │  │                                                        │  │   │
│  │  │  2. Fill form fields                                  │  │   │
│  │  │     → onChange() updates form state                   │  │   │
│  │  │                                                        │  │   │
│  │  │  3. Click "Add Product"                               │  │   │
│  │  │     → onSubmit() validates all fields                 │  │   │
│  │  │     → Creates FormData with files + fields            │  │   │
│  │  │     → POST to /api/subadmin/mystore/products/create   │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │        API Client: lib/api.js (axios instance)               │   │
│  │  • Automatically adds Authorization header                   │   │
│  │  • Handles request/response interceptors                     │   │
│  │  • Resolves baseURL to http://localhost:4000               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ POST (multipart/form-data)
                                │ Authorization: Bearer {token}
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND: Express.js Server                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Route: POST /api/subadmin/mystore/products/create           │   │
│  │                                                                │   │
│  │  Middleware Chain:                                            │   │
│  │  ┌─────────────────────────────────────────────────────────┐ │   │
│  │  │ 1. isSubAdmin Middleware                                │ │   │
│  │  │    • Extract & verify JWT token                         │ │   │
│  │  │    • Check role === "subadmin"                          │ │   │
│  │  │    • Extract miniStoreId from token                     │ │   │
│  │  │    • Set req.user = { id, email, role, miniStoreId }   │ │   │
│  │  │    • Call next() or return 403 Forbidden                │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │                                    │                           │   │
│  │  ┌─────────────────────────────────▼─────────────────────────┐ │   │
│  │  │ 2. upload.fields() Middleware (multer)                    │ │   │
│  │  │    • Parse multipart/form-data                           │ │   │
│  │  │    • Extract files into req.files:                       │ │   │
│  │  │      {                                                   │ │   │
│  │  │        image1: [{ fieldname, originalname, buffer }],    │ │   │
│  │  │        image2: [{ ... }],                               │ │   │
│  │  │        ...                                               │ │   │
│  │  │      }                                                   │ │   │
│  │  │    • Extract fields into req.body:                       │ │   │
│  │  │      { name, price, description, ... }                  │ │   │
│  │  │    • Call next() if success or return 400 error          │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  │                                    │                           │   │
│  │  ┌─────────────────────────────────▼─────────────────────────┐ │   │
│  │  │ 3. createNewProduct Controller                            │ │   │
│  │  │                                                            │ │   │
│  │  │    Step 1: Validate Inputs                               │ │   │
│  │  │    • name, description, price, category required         │ │   │
│  │  │    • Return 400 if missing                               │ │   │
│  │  │                                                            │ │   │
│  │  │    Step 2: Process Sizes                                 │ │   │
│  │  │    • Parse from JSON string or comma-separated           │ │   │
│  │  │    • Result: [\"S\", \"M\", \"L\", ...]                  │ │   │
│  │  │                                                            │ │   │
│  │  │    Step 3: Upload Images to Cloudinary                   │ │   │
│  │  │    FOR each file in req.files (image1-4):                │ │   │
│  │  │      ├─ Get file.buffer (in memory)                      │ │   │
│  │  │      ├─ Create upload_stream to Cloudinary               │ │   │
│  │  │      ├─ Set folder: \"products\"                         │ │   │
│  │  │      ├─ stream.end(file.buffer) triggers upload          │ │   │
│  │  │      └─ Collect result.secure_url                        │ │   │
│  │  │    END FOR                                                │ │   │
│  │  │                                                            │ │   │
│  │  │    Step 4: Combine Images                                │ │   │
│  │  │    • Merge body images + uploaded URLs                   │ │   │
│  │  │    • Validate at least 1 exists                          │ │   │
│  │  │                                                            │ │   │
│  │  │    Step 5: Create Product in MongoDB                     │ │   │
│  │  │    • new Product({                                       │ │   │
│  │  │        name, description, price,                         │ │   │
│  │  │        category, subCategory,                            │ │   │
│  │  │        sizes, images: [urls], stock, bestseller,         │ │   │
│  │  │        date: Date.now()                                  │ │   │
│  │  │      })                                                  │ │   │
│  │  │                                                            │ │   │
│  │  │    Step 6: Link to Mini Store                            │ │   │
│  │  │    • Get miniStore from req.user.miniStoreId             │ │   │
│  │  │    • Push product._id to store.products                  │ │   │
│  │  │    • await store.save()                                  │ │   │
│  │  │                                                            │ │   │
│  │  │    Step 7: Return Response                               │ │   │
│  │  │    • {                                                   │ │   │
│  │  │        success: true,                                    │ │   │
│  │  │        message: \"Product created and added to store\",   │ │   │
│  │  │        data: { product, store }                          │ │   │
│  │  │      }                                                   │ │   │
│  │  │                                                            │ │   │
│  │  │    Error Handling:                                        │ │   │
│  │  │    • Catch all exceptions                                │ │   │
│  │  │    • Return 500 with error message                       │ │   │
│  │  └─────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                    │                                   │
                    │                                   │
                    ▼                                   ▼
        ┌──────────────────────┐         ┌──────────────────────────┐
        │   CLOUDINARY CLOUD   │         │   MONGODB DATABASE       │
        ├──────────────────────┤         ├──────────────────────────┤
        │ Folder: products/    │         │ Collection: products     │
        │                      │         │                          │
        │ image1.jpg           │         │ {                        │
        │ image2.jpg           │         │   _id: ObjectId(...),    │
        │ image3.jpg           │         │   name: "T-Shirt",       │
        │                      │         │   price: 499,            │
        │ URLs returned:       │         │   images: [              │
        │ https://res....  ◄──────────────  "https://res.cloud..." │
        │ https://res....  ◄──────────────  "https://res.cloud..." │
        │ https://res....  ◄──────────────  ],                      │
        │                      │         │   miniStore: {ref},      │
        │                      │         │   ...                    │
        │                      │         │ }                        │
        └──────────────────────┘         │                          │
                                         │ Collection: ministores   │
                                         │                          │
                                         │ {                        │
                                         │   _id: ObjectId(...),    │
                                         │   products: [            │
                                         │     ObjectId("..."),  ◄──
                                         │     ObjectId("...")      │
                                         │   ]                      │
                                         │ }                        │
                                         └──────────────────────────┘
```

---

## Request/Response Flow

### 1. CREATE PRODUCT REQUEST

```
Client Browser                   Express Server                 External Services
═════════════════════════════════════════════════════════════════════════════════

User selects images
(4 slots, optional)
      │
      ├─ imageFiles = [File, File, null, null]
      │
      └─ Creates FormData
           ├─ name: "T-Shirt"
           ├─ description: "Cotton..."
           ├─ price: "499"
           ├─ category: "Men"
           ├─ subCategory: "Topwear"
           ├─ sizes: '["S","M","L"]'
           ├─ stock: "50"
           ├─ bestseller: "false"
           ├─ image1: <File Object>
           └─ image2: <File Object>
                                                                  
                POST /api/subadmin/mystore/products/create
                Authorization: Bearer eyJhbG... ──────────────►
                Content-Type: multipart/form-data
                
                                          │
                                          ├─► isSubAdmin Middleware
                                          │   • Verify token
                                          │   • Check role="subadmin"
                                          │   • Extract miniStoreId
                                          │
                                          ├─► upload.fields()
                                          │   • req.files = {
                                          │       image1: [buffer],
                                          │       image2: [buffer]
                                          │     }
                                          │   • req.body = {
                                          │       name, price, ...
                                          │     }
                                          │
                                          ├─► createNewProduct()
                                          │   ├─► Validate
                                          │   ├─► Process sizes
                                          │   ├─► Upload to Cloudinary
                                          │   │   ├─► image1.buffer ─────────────►
                                          │   │   │   Cloudinary upload_stream
                                          │   │   │   folder: "products"
                                          │   │   │
                                          │   │   └─ https://res.cloudinary....
                                          │   │
                                          │   │   ├─► image2.buffer ─────────────►
                                          │   │   │   Cloudinary upload_stream
                                          │   │   │
                                          │   │   └─ https://res.cloudinary....
                                          │   │
                                          │   ├─► Create product in MongoDB
                                          │   │   {
                                          │   │     images: [
                                          │   │       "https://res.cloudinary...",
                                          │   │       "https://res.cloudinary..."
                                          │   │     ]
                                          │   │   }
                                          │   │
                                          │   └─► Link to mini store
                                          │       store.products.push(product._id)
                                          │
                      ◄─────────────────────── {
                        201 Created            success: true,
                        Content-Type: json     message: "Created",
                                               data: { product, store }
                                             }

Response shown to user ◄─────
✅ "Product created successfully"
Product appears in list with images
```

---

## File Structure (Modified Files)

```
new_myk/
├── miniadmin/
│   └── src/
│       └── pages/
│           └── ProductForm.jsx ✅ MODIFIED
│               ├─ handleImageUpload() - now stores files locally
│               ├─ onSubmit() - creates FormData, sends multipart
│               └─ State: imageFiles, imageUrls
│
└── backend/
    ├── routes/
    │   └── subadminRoutes.js ✅ MODIFIED
    │       ├─ import upload from "../middleware/multer.js"
    │       ├─ POST /mystore/products/create
    │       │   ├─ isSubAdmin middleware
    │       │   ├─ upload.fields([...]) ← ADDED
    │       │   └─ createNewProduct controller
    │       │
    │       └─ PUT /mystore/products/:productId
    │           ├─ isSubAdmin middleware
    │           ├─ upload.fields([...]) ← ADDED
    │           └─ updateMyProduct controller
    │
    └── controllers/
        └── subadminController.js ✅ MODIFIED
            ├─ import { v2 as cloudinary } from "cloudinary"
            │
            ├─ createNewProduct(req, res)
            │   ├─ Validate inputs
            │   ├─ Process sizes (JSON.parse support)
            │   ├─ Upload files to Cloudinary ← ADDED
            │   ├─ Create Product with images
            │   └─ Link to mini store
            │
            └─ updateMyProduct(req, res)
                ├─ Verify ownership
                ├─ Upload files to Cloudinary ← ADDED
                ├─ Append new images to existing
                └─ Save product

Other files (NO CHANGES):
├── middleware/multer.js ✅ Already exists
├── config/cloudinary.js ✅ Already configured
├── models/productModel.js ✅ Already has images field
├── middleware/roleMiddleware.js ✅ isSubAdmin exists
└── admin/ ✅ Completely untouched
```

---

## Data Models

### Product Document (MongoDB)
```javascript
{
  _id: ObjectId("..."),
  name: "Cotton T-Shirt",
  description: "High quality...",
  price: 499,
  images: [
    "https://res.cloudinary.com/cloud/image/upload/v1731385200/products/abc123.jpg",
    "https://res.cloudinary.com/cloud/image/upload/v1731385201/products/def456.jpg"
  ],
  category: "Men",
  subCategory: "Topwear",
  sizes: ["S", "M", "L"],
  stock: 50,
  bestseller: false,
  slug: "cotton-t-shirt",
  isActive: true,
  date: 1731385200000,
  createdAt: ISODate("2025-11-12T..."),
  updatedAt: ISODate("2025-11-12T...")
}
```

### Mini Store Document (MongoDB)
```javascript
{
  _id: ObjectId("..."),
  displayName: "My Store",
  bio: "Store description",
  products: [
    ObjectId("..."), // Product 1
    ObjectId("..."), // Product 2
    ObjectId("...")  // Product 3 (just added)
  ],
  isActive: true,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### User Document (MongoDB) - Sub-Admin
```javascript
{
  _id: ObjectId("..."),
  name: "Sub-Admin Name",
  email: "subadmin@example.com",
  password: "$2a$10$...",
  role: "subadmin",
  miniStoreId: ObjectId("..."), // Reference to mini store
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## Cloudinary Configuration

```javascript
// server.js or config/cloudinary.js
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  secure: true
})

// Upload stream options used:
{
  resource_type: "image",    // Only accept images
  folder: "products"         // Organize in folder
}
```

---

## Security Layers

```
Layer 1: Authentication
└─ JWT Token required in Authorization header
   └─ isSubAdmin middleware verifies token

Layer 2: Authorization  
└─ Role check: role must be "subadmin"
   └─ Extract miniStoreId from verified token

Layer 3: Ownership
└─ Verify product belongs to user's miniStore
   └─ Only allow updates to own products

Layer 4: Input Validation
└─ Required fields checked
   └─ At least 1 image required
   └─ Price must be positive

Layer 5: File Upload
└─ Multer enforces field names & max counts
   └─ Memory storage (no disk writes)
   └─ Cloudinary URL validation
```

---

**Last Updated**: November 12, 2025  
**Architecture Version**: 1.0  
**Status**: Production Ready ✅
