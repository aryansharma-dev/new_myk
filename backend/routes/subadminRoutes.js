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
import upload from "../middleware/multer.js";

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
router.delete("/mystore/products/:productId", isSubAdmin, deleteMyProduct);
router.get("/mystore/orders", isSubAdmin, getMyStoreOrders);

export default router;
