import express from "express";
import MiniStore from "../models/miniStoreModel.js";
import { normalizeProductImages } from "../utils/productImages.js";
import { RESERVED } from "./miniStoreRoutes.js";

const router = express.Router();

const truthy = (value) => {
  if (value === undefined || value === null) return false;
  const normalised = String(value).trim().toLowerCase();
  if (!normalised) return false;
  return !["0", "false", "no", "off"].includes(normalised);
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return fallback;
};

router.get("/", async (req, res) => {
  try {
    const rawSlug = req.query?.slug;
    const slug = typeof rawSlug === "string" ? rawSlug.trim().toLowerCase() : "";

    if (slug) {
      if (RESERVED.has(slug)) {
        return res.status(404).json({
          success: false,
          message: "Not a mini store",
        });
      }

      const storeDoc = await MiniStore.findOne({ slug, isActive: true })
        .populate({ path: "products", options: { lean: true } })
        .lean();

      if (!storeDoc) {
        return res.status(404).json({
          success: false,
          message: "Store not found",
        });
      }

      const store = {
        ...storeDoc,
        products: (storeDoc.products || []).map(normalizeProductImages),
      };

      return res.json({
        success: true,
        message: "Mini store fetched",
        data: { store },
        store,
      });
    }

    const wantsAll = truthy(req.query?.all);
    const limit = wantsAll ? 0 : toPositiveInt(req.query?.limit, 8);

    const filter = wantsAll ? {} : { isActive: true };
    const query = MiniStore.find(filter)
      .select("slug displayName avatarUrl bannerUrl bio isActive createdAt")
      .sort({ createdAt: -1 });

    if (!wantsAll && limit) {
      query.limit(limit);
    }

    const stores = await query.lean();

    return res.json({
      success: true,
      message: "Mini stores fetched",
      data: { stores },
      stores,
    });
  } catch (error) {
    console.error("Legacy mini store route error:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Mini store fetch failed",
    });
  }
});

export default router;