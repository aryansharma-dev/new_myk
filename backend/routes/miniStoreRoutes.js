import express from "express";
import miniStoreModel from "../models/miniStoreModel.js";
import userModel from "../models/userModel.js";
import { normalizeProductImages } from "../utils/productImages.js";
import bcrypt from "bcryptjs";

// Controllers
import {
    createMiniStore,
    getAllMiniStores,
    getMiniStoreById,
    updateMiniStore,
    deleteMiniStore,
    toggleStoreStatus,
    getMiniStoreActivity  // ✅ Activity function added
} from "../controllers/miniStoreController.js";

import {
    subAdminLogin,
    getMyStore,
    updateMyStore,
    getMyProducts,
    addProductToStore,
    removeProductFromStore,
    createNewProduct,
    getMyStoreOrders
} from "../controllers/subadminController.js";

// Middleware
import { isAdmin, isSubAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Reserved slugs
export const RESERVED = new Set([
    "", "home", "about", "contact", "collection", "collections", "cart", "checkout",
    "privacy-policy", "terms", "return-refund", "faqs", "login", "signup",
    "admin", "api", "sitemap.xml", "robots.txt", "search", "account", "orders", 
    "product", "store", "subadmin", "auth"
]);

// Slug generator utility
const slugify = (text = "") =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-+/g, "-");

// ============================================
// PUBLIC ROUTES (No Auth Required)
// ============================================

/**
 * Get All Active Mini Stores (Public)
 * GET /api/ministores?limit=8
 */
router.get("/", async (req, res) => {
    try {
        const { all, limit } = req.query;
        const queryLimit = all ? 0 : Number(limit) || 8;
        const filter = all ? {} : { isActive: true };
        
        const storesQuery = miniStoreModel
            .find(filter)
            .select("slug displayName avatarUrl bannerUrl bio isActive createdAt")
            .sort({ createdAt: -1 });
        
        if (queryLimit > 0) storesQuery.limit(queryLimit);
        
        const stores = await storesQuery.lean();
        res.json(stores);
        
    } catch (err) {
        console.error("[Get all stores error]:", err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * Get Mini Store by Slug (Public)
 * GET /api/ministores/store/:slug
 */
router.get("/store/:slug", async (req, res) => {
    try {
        const slugParam = String(req.params.slug || "").trim().toLowerCase();
        
        // Check reserved words
        if (!slugParam || RESERVED.has(slugParam)) {
            return res.status(404).json({ message: "Not a mini store" });
        }
        
        // ✅ Product limit support added (from Folder 1)
        const rawProductLimit = req?.query?.productLimit;
        const parsedLimit = Number.parseInt(rawProductLimit, 10);
        const productLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
            ? Math.min(parsedLimit, 60)
            : undefined;

        const populateOptions = {
            path: "products",
            select: "name price images category subCategory sizes",
            options: { lean: true }
        };

        if (productLimit) {
            populateOptions.options.limit = productLimit;
        }
        
        const storeDoc = await miniStoreModel
            .findOne({ slug: slugParam, isActive: true })
            .populate(populateOptions)
            .lean();
        
        if (!storeDoc) {
            return res.status(404).json({ message: "Store not found" });
        }
        
        // Normalize product images
        const products = (storeDoc.products || []).map(normalizeProductImages);
        
        res.json({ ...storeDoc, products });

    } catch (err) {
        console.error("[Get store by slug error]:", err);
        res.status(500).json({ message: err.message });
    }
});

// ============================================
// AUTH ROUTES
// ============================================

// NOTE: Express matches routes in registration order; namespacing the slug
// route above keeps /admin and /subadmin handlers from being shadowed

/**
 * Sub-Admin Login
 * POST /api/ministores/auth/subadmin/login
 */
router.post("/auth/subadmin/login", subAdminLogin);

// ============================================
// MAIN ADMIN ROUTES (Admin Only)
// ============================================

/**
 * Create Mini Store + Sub-Admin User
 * POST /api/ministores/admin/create
 */
router.post("/admin/create", isAdmin, createMiniStore);

/**
 * Get All Stores (Admin View - includes inactive)
 * GET /api/ministores/admin/all
 */
router.get("/admin/all", isAdmin, getAllMiniStores);

/**
 * Get Single Store by ID (Admin)
 * GET /api/ministores/admin/:id
 */
router.get("/admin/:id", isAdmin, getMiniStoreById);

/**
 * ✅ Get activity summary for a store (Admin)
 * GET /api/ministores/admin/:id/activity
 */
router.get('/admin/:id/activity', isAdmin, getMiniStoreActivity);

/**
 * Update Store (Admin)
 * PUT /api/ministores/admin/:id
 */
router.put("/admin/:id", isAdmin, updateMiniStore);

/**
 * Delete Store (Admin)
 * DELETE /api/ministores/admin/:id
 */
router.delete("/admin/:id", isAdmin, deleteMiniStore);

/**
 * Toggle Store Active Status (Admin)
 * PATCH /api/ministores/admin/:id/toggle
 */
router.patch("/admin/:id/toggle", isAdmin, toggleStoreStatus);

// ============================================
// SUB-ADMIN ROUTES (Sub-Admin Only)
// ============================================

/**
 * Get Own Store
 * GET /api/ministores/subadmin/mystore
 */
router.get("/subadmin/mystore", isSubAdmin, getMyStore);

/**
 * Update Own Store Profile
 * PUT /api/ministores/subadmin/mystore
 */
router.put("/subadmin/mystore", isSubAdmin, updateMyStore);

/**
 * Get Own Products
 * GET /api/ministores/subadmin/mystore/products
 */
router.get("/subadmin/mystore/products", isSubAdmin, getMyProducts);

/**
 * Add Product to Own Store
 * POST /api/ministores/subadmin/mystore/products
 */
router.post("/subadmin/mystore/products", isSubAdmin, addProductToStore);

/**
 * Create New Product (and add to store)
 * POST /api/ministores/subadmin/mystore/products/create
 */
router.post("/subadmin/mystore/products/create", isSubAdmin, createNewProduct);

/**
 * Get Orders that contain products from this store
 * GET /api/ministores/subadmin/mystore/orders
 */
router.get("/subadmin/mystore/orders", isSubAdmin, getMyStoreOrders);

/**
 * Remove Product from Own Store
 * DELETE /api/ministores/subadmin/mystore/products/:productId
 */
router.delete("/subadmin/mystore/products/:productId", isSubAdmin, removeProductFromStore);

// ============================================
// LEGACY/COMPATIBILITY ROUTES (Keep for backward compatibility)
// ============================================

/**
 * Legacy: Create store without user (kept for compatibility)
 * POST /api/ministores
 * Note: Use /admin/create instead for new implementations
 */
router.post("/", async (req, res) => {
    try {
        let { slug, displayName, email, password } = req.body;
        
        if (!displayName) {
            return res.status(400).json({ message: "displayName required" });
        }

        displayName = String(displayName).trim();

        const normalizedEmail = String(email || "").trim().toLowerCase();
        const passwordValue = String(password || "");

        if (!displayName) {
            return res.status(400).json({ message: "displayName required" });
        }

        if (!normalizedEmail || !passwordValue) {
            return res.status(400).json({ message: "email and password required" });
        }

        const providedSlug = typeof slug === "string" ? slug : "";
        let clean = slugify(providedSlug.trim());
        
        if (!clean) {
            clean = slugify(displayName);
        }
        
        if (!clean || RESERVED.has(clean)) {
            clean = `store-${Date.now()}`;
        }
        
        // Ensure unique slug
        let uniqueSlug = clean;
        let suffix = 1;
        while (await miniStoreModel.findOne({ slug: uniqueSlug })) {
            uniqueSlug = `${clean}-${suffix++}`;
        }

        // Check for existing sub-admin email
        const existingUser = await userModel.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(passwordValue, 10);

        const newUser = new userModel({
            name: displayName,
            email: normalizedEmail,
            password: hashedPassword,
            role: "subadmin",
            cartData: {}
        });

        const savedUser = await newUser.save();

        const payload = {
            ...req.body,
            slug: uniqueSlug,
            displayName,
            userId: savedUser._id
        };

        delete payload.password;
        delete payload.email;

        const storeDoc = await miniStoreModel.create(payload);

        savedUser.miniStoreId = storeDoc._id;
        await savedUser.save();

        const store = storeDoc.toObject ? storeDoc.toObject() : storeDoc;
        store.subAdmin = {
            id: savedUser._id,
            name: savedUser.name,
            email: savedUser.email
        };
        
        res.status(201).json(store);
        
    } catch (err) {
        console.error("[Legacy create store error]:", err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * Legacy: Toggle status by ID (kept for compatibility)
 * PATCH /api/ministores/:id/toggle
 * Note: Use /admin/:id/toggle instead for new implementations
 */
router.patch("/:id/toggle", async (req, res) => {
    try {
        const { id } = req.params;
        const store = await miniStoreModel.findById(id);
        
        if (!store) {
            return res.status(404).json({ message: "Store not found" });
        }
        
        store.isActive = !store.isActive;
        await store.save();
        
        res.json({ success: true, isActive: store.isActive });
        
    } catch (err) {
        console.error("[Legacy toggle error]:", err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * Legacy: Delete by ID (kept for compatibility)
 * DELETE /api/ministores/:id
 * Note: Use /admin/:id instead for new implementations
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const store = await miniStoreModel.findById(id);
        
        if (!store) {
            return res.status(404).json({ message: "Store not found" });
        }
        
        await miniStoreModel.findByIdAndDelete(id);
        
        res.json({ success: true, message: "Deleted" });
        
    } catch (err) {
        console.error("[Legacy delete error]:", err);
        res.status(500).json({ message: err.message });
    }
});

export default router;