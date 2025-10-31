import express from "express";

import {
    subAdminLogin,
    getMyStore,
    updateMyStore,
    getMyProducts,
    addProductToStore,
    removeProductFromStore,
    createNewProduct,
    getMyStoreOrders,
    updateMyProduct,
    deleteMyProduct
} from "../controllers/subadminController.js";

import { isSubAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * Sub-Admin Auth
 * POST /api/subadmin/auth/login
 */
router.post("/auth/login", subAdminLogin);

/**
 * Store endpoints (sub-admin)
 */
router.get("/mystore", isSubAdmin, getMyStore);
router.put("/mystore", isSubAdmin, updateMyStore);
router.get("/mystore/products", isSubAdmin, getMyProducts);
router.post("/mystore/products", isSubAdmin, addProductToStore);
router.post("/mystore/products/create", isSubAdmin, createNewProduct);
router.put('/mystore/products/:productId', isSubAdmin, updateMyProduct);
router.delete("/mystore/products/:productId", isSubAdmin, deleteMyProduct);
router.get("/mystore/orders", isSubAdmin, getMyStoreOrders);

export default router;
