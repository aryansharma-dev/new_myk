import miniStoreModel from "../models/miniStoreModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * Create Mini Store + Sub-Admin User
 * POST /api/admin/ministores
 * Access: Main Admin Only
 */
export const createMiniStore = async (req, res) => {
    try {
        const { displayName, slug, bio, email, password } = req.body;
        
        const trimmedDisplayName = String(displayName || "").trim();
        const slugValue = String(slug || "").trim().toLowerCase();
        const normalizedEmail = String(email || "").trim().toLowerCase(); // Normalize email casing/whitespace before queries
        const passwordValue = String(password || "");

        // Validation
        if (!trimmedDisplayName || !normalizedEmail || !passwordValue || !slugValue) {
            return res.status(400).json({
                success: false,
                message: "Display name, slug, email and password are required"
            });
        }

        // Check if slug already exists
        const existingStore = await miniStoreModel.findOne({
            slug: slugValue 
        });
        if (existingStore) {
            return res.status(400).json({
                success: false,
                message: "Slug already exists. Choose a different one."
            });
        }

        // Check if email already exists
        const existingUser = await userModel.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(passwordValue, 10);

        // Create sub-admin user
        const newUser = new userModel({
            name: trimmedDisplayName,
            email: normalizedEmail,
            password: hashedPassword,
            role: "subadmin",
            cartData: {}
        });

        const savedUser = await newUser.save();

        // Create mini store
        const newStore = new miniStoreModel({
            userId: savedUser._id,
            slug: slugValue,
            displayName: trimmedDisplayName,
            bio: bio || "",
            avatarUrl: "",
            bannerUrl: "",
            products: [],
            isActive: true
        });

        const savedStore = await newStore.save();

        // Update user with miniStoreId
        savedUser.miniStoreId = savedStore._id;
        await savedUser.save();

        res.status(201).json({
            success: true,
            message: "Mini store and sub-admin created successfully",
            displayName: trimmedDisplayName,
            store: savedStore,
            c// TODO: deliver initial credentials via a secure channel (email/SMS) or force reset on first login.
        });

    } catch (error) {
        console.error("[createMiniStore error]:", error);
        res.status(500).json({
            success: false,
            message: "Server error while creating mini store"
        });
    }
};

/**
 * Get All Mini Stores
 * GET /api/admin/ministores
 * Access: Main Admin Only
 */
export const getAllMiniStores = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, isActive } = req.query;

        const query = {};

        // Search filter
        if (search) {
            query.$or = [
                { displayName: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } }
            ];
        }

        // Active filter
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const stores = await miniStoreModel
            .find(query)
            .populate('userId', 'name email')
            .populate('products', 'name price image')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await miniStoreModel.countDocuments(query);

        res.json({
            success: true,
            stores,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error("[getAllMiniStores error]:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching stores"
        });
    }
};

/**
 * Get Single Mini Store by ID
 * GET /api/admin/ministores/:id
 * Access: Main Admin Only
 */
export const getMiniStoreById = async (req, res) => {
    try {
        const { id } = req.params;

        const store = await miniStoreModel
            .findById(id)
            .populate('userId', 'name email role')
            .populate('products', 'name price image category');

        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }

        res.json({
            success: true,
            store
        });

    } catch (error) {
        console.error("[getMiniStoreById error]:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching store"
        });
    }
};

/**
 * Update Mini Store
 * PUT /api/admin/ministores/:id
 * Access: Main Admin Only
 */
export const updateMiniStore = async (req, res) => {
    try {
        const { id } = req.params;
        const { displayName, bio, avatarUrl, bannerUrl, slug } = req.body;

        const store = await miniStoreModel.findById(id);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }

        // Check if slug is being changed and if it already exists
        if (slug && slug !== store.slug) {
            const slugValue = slug.trim().toLowerCase();
            
            // Validate slug is not empty
            if (!slugValue) {
                return res.status(400).json({
                    success: false,
                    message: "Slug cannot be empty"
                });
            }

            const existingSlug = await miniStoreModel.findOne({ 
                slug: slugValue,
                _id: { $ne: id }
            });

            if (existingSlug) {
                return res.status(400).json({
                    success: false,
                    message: "Slug already exists"
                });
            }

            store.slug = slugValue;
        }

        // Update fields
        if (displayName) store.displayName = displayName.trim();
        if (bio !== undefined) store.bio = bio;
        if (avatarUrl !== undefined) store.avatarUrl = avatarUrl;
        if (bannerUrl !== undefined) store.bannerUrl = bannerUrl;

        const updatedStore = await store.save();

        res.json({
            success: true,
            message: "Store updated successfully",
            store: updatedStore
        });

    } catch (error) {
        console.error("[updateMiniStore error]:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating store"
        });
    }
};

/**
 * Delete Mini Store
 * DELETE /api/admin/ministores/:id
 * Access: Main Admin Only
 */
export const deleteMiniStore = async (req, res) => {
    try {
        const { id } = req.params;

        const store = await miniStoreModel.findById(id);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }

        // Delete associated user
        if (store.userId) {
            await userModel.findByIdAndDelete(store.userId);
        }

        // Delete store
        await miniStoreModel.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Store and associated user deleted successfully"
        });

    } catch (error) {
        console.error("[deleteMiniStore error]:", error);
        res.status(500).json({
            success: false,
            message: "Server error while deleting store"
        });
    }
};

/**
 * Toggle Store Active Status
 * PATCH /api/admin/ministores/:id/toggle
 * Access: Main Admin Only
 */
export const toggleStoreStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const store = await miniStoreModel.findById(id);

        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Store not found"
            });
        }

        store.isActive = !store.isActive;
        await store.save();

        res.json({
            success: true,
            message: `Store ${store.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: store.isActive
        });

    } catch (error) {
        console.error("[toggleStoreStatus error]:", error);
        res.status(500).json({
            success: false,
            message: "Server error while toggling store status"
        });
    }
};

/**
 * Get activity summary for a mini store (admin)
 * GET /api/admin/ministores/:id/activity
 */
export const getMiniStoreActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const store = await miniStoreModel.findById(id).populate('products');
        if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

        const totalProducts = (store.products || []).length;

        // Count orders that include any product from this store
        const productIds = store.products.map(p => p._id ? p._id : p);
        const totalOrders = await orderModel.countDocuments({ 'cartItems.product': { $in: productIds } });

        // Try to get last login from associated user (if exists)
        let lastLogin = null;
        if (store.userId) {
            const user = await userModel.findById(store.userId).select('updatedAt createdAt');
            lastLogin = user?.updatedAt || user?.createdAt || null;
        }

        // Recent activity: recent product creations (by date) and recent orders
        const recentProducts = await productModel.find({ _id: { $in: productIds } }).sort({ createdAt: -1 }).limit(5).select('name createdAt');
        const recentOrders = await orderModel.find({ 'cartItems.product': { $in: productIds } }).sort({ createdAt: -1 }).limit(5).select('createdAt status');

        const recentActivity = [];
        recentProducts.forEach(p => recentActivity.push({ action: 'product_created', timestamp: p.createdAt || p.date || null, details: { name: p.name, id: p._id } }));
        recentOrders.forEach(o => recentActivity.push({ action: 'order', timestamp: o.createdAt || o.date || null, details: { id: o._id, status: o.status } }));

        // Sort recentActivity by timestamp desc and limit
        recentActivity.sort((a,b) => (new Date(b.timestamp) - new Date(a.timestamp)));

        return res.json({ success: true, data: { totalProducts, totalOrders, lastLogin, recentActivity: recentActivity.slice(0,10) } });
    } catch (error) {
        console.error('[getMiniStoreActivity error]:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};