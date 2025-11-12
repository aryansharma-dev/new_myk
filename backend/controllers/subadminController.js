import miniStoreModel from "../models/miniStoreModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import orderModel from "../models/orderModel.js";
import { v2 as cloudinary } from "cloudinary";
import { toBool } from "../utils/boolean.js"; // Shared boolean normalizer for bestseller flag parsing
import { normalizeProductImages } from "../utils/productImages.js";

/**
 * Sub-Admin Login
 * POST /api/auth/subadmin/login
 * Access: Public
 */
export const subAdminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || "").trim().toLowerCase(); // Normalize email casing/whitespace before lookup
        const passwordValue = String(password || "");

        if (!normalizedEmail || !passwordValue) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user
        const user = await userModel.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Check if user is subadmin
        if (user.role !== "subadmin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. This login is for sub-admins only."
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(passwordValue, user.password); // Compare using sanitized password input

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        // Check if mini store exists
        if (!user.miniStoreId) {
            return res.status(403).json({
                success: false,
                message: "No mini store assigned to this account"
            });
        }

        // Verify store is active
        const mystore = await miniStoreModel.findById(user.miniStoreId);
        if (!mystore || !mystore.isActive) {
            return res.status(403).json({ success: false, message: 'Your store is currently inactive. Please contact admin.' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: "subadmin"
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                miniStoreId: user.miniStoreId
            }
        });

    } catch (error) {
        console.error("[subAdminLogin error]:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login"
        });
    }
};

/**
 * Get Own Store Details
 * GET /api/subadmin/mystore
 * Access: Sub-Admin Only
 */
export const getMyStore = async (req, res) => {
    try {
        console.log('[getMyStore] Called with req.user:', req.user);

        if (!req.user?.miniStoreId) {
            console.error('[getMyStore] ERROR: miniStoreId not found in req.user');
            return res.status(400).json({ success: false, message: 'Mini store ID not found' });
        }

        const store = await miniStoreModel
            .findById(req.user.miniStoreId)
            .populate('products', 'name price images image category sizes bestseller');

        console.log('[getMyStore] Store found:', store ? { id: store._id, displayName: store.displayName, productsCount: (store.products || []).length } : null);

        if (!store) {
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        const storePayload = (() => {
            if (!store) return store;
            const plain = typeof store.toObject === "function" ? store.toObject() : { ...store };
            const products = (plain.products || []).map(normalizeProductImages);
            return { ...plain, products };
        })();

        // Return both top-level `store` and nested `data.store` for backward compatibility
        return res.json({ success: true, message: 'Store fetched', store: storePayload, data: { store: storePayload } });

    } catch (error) {
        console.error("[getMyStore error]:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching store"
        });
    }
};

/**
 * Update Own Store Profile
 * PUT /api/subadmin/mystore
 * Access: Sub-Admin Only
 */
export const updateMyStore = async (req, res) => {
    try {
        const { displayName, bio, avatarUrl, bannerUrl } = req.body;

        console.log('[updateMyStore] Called with req.user:', req.user, 'body:', { displayName, bio, avatarUrl, bannerUrl });

        if (!req.user?.miniStoreId) {
            console.error('[updateMyStore] ERROR: miniStoreId missing in req.user');
            return res.status(400).json({ success: false, message: 'Mini store ID not found' });
        }

        const store = await miniStoreModel.findById(req.user.miniStoreId);

        if (!store) {
            console.error('[updateMyStore] Store not found for id:', req.user.miniStoreId);
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        // Update fields
        if (displayName) store.displayName = displayName.trim();
        if (bio !== undefined) store.bio = bio;
        if (avatarUrl !== undefined) store.avatarUrl = avatarUrl;
        if (bannerUrl !== undefined) store.bannerUrl = bannerUrl;

        const updatedStore = await store.save();

        // Return both top-level `store` and nested `data.store` for backward compatibility
        res.json({ success: true, message: 'Store updated successfully', store: updatedStore, data: { store: updatedStore } });

    } catch (error) {
        console.error("[updateMyStore error]:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating store"
        });
    }
};

/**
 * Get Own Products
 * GET /api/subadmin/mystore/products
 * Access: Sub-Admin Only
 */
export const getMyProducts = async (req, res) => {
    try {
        const store = await miniStoreModel
            .findById(req.user.miniStoreId)
            .populate('products');

        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }
       
        const products = (store.products || []).map(normalizeProductImages);

        // Return top-level products too for frontend compatibility
        return res.json({ success: true, message: 'Products fetched', products, data: { products } });

    } catch (error) {
        console.error("[getMyProducts error]:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching products"
        });
    }
};

/**
 * Add Product to Own Store
 * POST /api/subadmin/mystore/products
 * Access: Sub-Admin Only
 */
export const addProductToStore = async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required"
            });
        }

        // Check if product exists
        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const store = await miniStoreModel.findById(req.user.miniStoreId);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }

        const pid = String(productId); // Normalise product id for ObjectId comparison

        // Check if product already added using string comparison to catch ObjectId duplicates
        if (store.products?.some(id => id?.toString() === pid)) {
            return res.status(400).json({
                success: false,
                message: "Product already added to store"
            });
        }

        // Add product to store
        store.products.push(productId); // Safe to push after duplicate guard above
        await store.save();

        res.json({
            success: true,
            message: "Product added to store successfully",
            data: { store }
        });

    } catch (error) {
        console.error("[addProductToStore error]:", error);
        res.status(500).json({
            success: false,
            message: "Server error while adding product"
        });
    }
};

/**
 * Remove Product from Own Store
 * DELETE /api/subadmin/mystore/products/:productId
 * Access: Sub-Admin Only
 */
export const removeProductFromStore = async (req, res) => {
    try {
        const { productId } = req.params;

        const store = await miniStoreModel.findById(req.user.miniStoreId);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }

        // Remove product from store
        store.products = store.products.filter(
            id => id.toString() !== productId
        );

        await store.save();

        res.json({
            success: true,
            message: "Product removed from store successfully",
            data: { store }
        });

    } catch (error) {
        console.error("[removeProductFromStore error]:", error);
        res.status(500).json({
            success: false,
            message: "Server error while removing product"
        });
    }
};

/**
 * Create New Product and add to sub-admin store
 * POST /api/subadmin/mystore/products/create
 * Access: Sub-Admin Only
 *
 * Request body: { name, description, price, category, subCategory, sizes, images, stock, bestseller }
 * Multipart files: image1, image2, image3, image4 (optional)
 * Response: { success, message, data: { product, store } }
 */
export const createNewProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            category,
            subCategory,
            sizes,
            images,
            stock,
            bestseller
        } = req.body;

        // Basic validation
        if (!name || !description || !price || !category || !subCategory) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Normalize sizes (accept array or comma-separated string)
        let sizesArr = [];
        if (Array.isArray(sizes)) sizesArr = sizes.map(s => String(s).trim()).filter(Boolean);
        else if (typeof sizes === "string") {
            try {
                const parsed = JSON.parse(sizes);
                if (Array.isArray(parsed)) sizesArr = parsed.map(s => String(s).trim()).filter(Boolean);
            } catch (_) {
                sizesArr = sizes.split(",").map(s => String(s).trim()).filter(Boolean);
            }
        }

        // Normalize images from request body (already uploaded URLs)
        let imagesArr = [];
        if (Array.isArray(images)) imagesArr = images.map(u => String(u).trim()).filter(Boolean);
        else if (typeof images === "string") imagesArr = images.split(",").map(u => String(u).trim()).filter(Boolean);

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
            return res.status(400).json({ success: false, message: "At least one image is required" });
        }

        const now = Date.now();
        const bestsellerFlag = toBool(bestseller);

        const newProduct = await productModel.create({
            name: String(name).trim(),
            description: String(description).trim(),
            price: Number(price),
            category: String(category).trim(),
            subCategory: String(subCategory).trim(),
            sizes: sizesArr.length ? sizesArr : [],
            images: allImages,
            stock: Number(stock) || 0,
            bestseller: bestsellerFlag,
            date: now
        });

        // Add product to sub-admin's store
        const store = await miniStoreModel.findById(req.user.miniStoreId);
        if (!store) {
            return res.status(404).json({ success: false, message: "Store not found" });
        }

        store.products = store.products || [];
        store.products.push(newProduct._id);
        await store.save();

        const payloadProduct = normalizeProductImages(newProduct);
        const payloadStore = typeof store.toObject === "function" ? store.toObject() : store;

        res.status(201).json({
            success: true,
            message: "Product created and added to store",
            data: { product: payloadProduct, store: payloadStore },
            product: payloadProduct,
            store: payloadStore
        });

    } catch (error) {
        console.error("[createNewProduct error]:", error);
        res.status(500).json({ success: false, message: "Server error while creating product" });
    }
};


/**
 * Get Orders Containing products from this sub-admin store
 * GET /api/subadmin/mystore/orders
 * Access: Sub-Admin Only
 *
 * Query params: status (optional), search (optional)
 * Response: { success, message, data: { count, orders } }
 */
export const getMyStoreOrders = async (req, res) => {
    try {
        console.log('[getMyStoreOrders] Called with req.user:', req.user);

        if (!req.user?.miniStoreId) {
            console.error('[getMyStoreOrders] ERROR: miniStoreId missing in req.user');
            return res.status(400).json({ success: false, message: 'Mini store ID not found' });
        }

        const store = await miniStoreModel.findById(req.user.miniStoreId).populate('products');

        if (!store) {
            console.error('[getMyStoreOrders] Store not found for id:', req.user.miniStoreId);
            return res.status(404).json({ success: false, message: 'Store not found' });
        }

        const productIds = (store.products || []).map(p => (typeof p === 'object' ? String(p._id || p) : String(p)));
        console.log('[getMyStoreOrders] Store products:', productIds);

        // Build query: orders where ANY cartItems.product matches one of productIds
        const baseQuery = { 'cartItems.product': { $in: productIds } };

        // Optional filters
        if (req.query.status) baseQuery.status = String(req.query.status);

        let orders = await orderModel.find(baseQuery)
            .populate({ path: 'user', select: 'name email' })
            .populate({ path: 'cartItems.product', select: 'name price images category' })
            .sort({ createdAt: -1 })
            .lean();

        console.log('[getMyStoreOrders] Orders fetched from DB:', (orders || []).length);

        // Log a sample of cartItems for tracing
        orders.slice(0, 5).forEach(o => {
            console.log('[getMyStoreOrders] order', o._id, 'cartItems:', (o.cartItems || []).map(ci => ({ product: ci.product, qty: ci.qty })));
        });

        // Optional search by order id or customer name
        if (req.query.search) {
            const s = String(req.query.search).toLowerCase();
            orders = orders.filter(o => {
                const idMatch = (o._id || '').toString().toLowerCase().includes(s);
                const customer = (o.user && (o.user.name || o.user.email)) || '';
                const customerMatch = String(customer).toLowerCase().includes(s);
                return idMatch || customerMatch;
            });
        }

        return res.json({ success: true, message: 'Orders fetched', count: orders.length, orders, data: { count: orders.length, orders } });

    } catch (error) {
        console.error("[getMyStoreOrders error]:", error);
        res.status(500).json({ success: false, message: "Server error while fetching orders" });
    }
};

/**
 * Update product owned/added by this sub-admin
 * PUT /api/subadmin/mystore/products/:productId
 */
export const updateMyProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updates = req.body || {};

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        const product = await productModel.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const store = await miniStoreModel.findById(req.user.miniStoreId);
        if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

        if (!store.products.map(p => p.toString()).includes(productId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized - product not in your store' });
        }

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

        // Apply allowed updates only
        const allowed = ['name','description','price','images','category','subCategory','sizes','stock','bestseller','isActive'];
        for (const key of Object.keys(updates)) {
            if (allowed.includes(key)) {
                product[key] = key === 'bestseller'
                    ? toBool(updates[key]) // Normalise bestseller updates via shared helper
                    : updates[key];
            }
        }

        // If new files were uploaded, merge them with existing images
        if (uploadedUrls.length > 0) {
            product.images = [...(product.images || []), ...uploadedUrls];
        }

        await product.save();
        const payloadProduct = normalizeProductImages(product);
        console.log('[updateMyProduct] Product updated:', productId, 'by subadmin:', req.user.id);
        return res.json({ success: true, message: 'Product updated', product: payloadProduct, data: { product: payloadProduct } });
    } catch (error) {
        console.error('[updateMyProduct] Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete product from store (and optional DB delete if exclusive)
 * DELETE /api/subadmin/mystore/products/:productId
 */
export const deleteMyProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        if (!productId) return res.status(400).json({ success: false, message: 'Product ID required' });

        const store = await miniStoreModel.findById(req.user.miniStoreId);
        if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

        const inStore = store.products.map(p => p.toString()).includes(productId);
        if (!inStore) return res.status(403).json({ success: false, message: 'Product not in your store' });

        // Remove from this store
        store.products = store.products.filter(p => p.toString() !== productId);
        await store.save();

        // Check other stores that reference this product
        const otherStores = await miniStoreModel.find({ products: productId }).select('_id');
        if (!otherStores || otherStores.length === 0) {
            // No other stores reference it - safe to delete from products collection
            await productModel.findByIdAndDelete(productId);
            console.log('[deleteMyProduct] Product deleted from DB:', productId);
            return res.json({ success: true, message: 'Product removed from store and deleted from catalog' });
        }

        console.log('[deleteMyProduct] Product removed from store only (present in other stores):', productId);
        return res.json({ success: true, message: 'Product removed from your store' });
    } catch (error) {
        console.error('[deleteMyProduct] Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};