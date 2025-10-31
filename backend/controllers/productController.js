import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import { normalizeProductImages, toImageArray } from "../utils/productImages.js";

const uploadBuffers = async (files = []) => {
  if (!files.length) return [];

  const streamUpload = (fileBuffer) =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(fileBuffer);
    });

  const uploads = [];
  for (const file of files) {
    if (!file?.buffer) continue;
    const out = await streamUpload(file.buffer);
    if (out?.secure_url) uploads.push(out.secure_url);
  }
  return uploads;
};

const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
  }
  return false;
};

const parseSizes = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parseSizes(parsed);
    } catch (_) {
      // fall through
    }
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, subCategory, bestseller } = req.body;

    const priceNumber = Number(price);
    const bestsellerBool = parseBoolean(bestseller);

    let sizes = parseSizes(req.body?.sizes || req.body?.size || []);
    const categoryLower = String(category || "").trim().toLowerCase();
    if (categoryLower === "jewellery" && !sizes.length) {
      sizes = ["nosize"];
    }

    const bodyImages = [
      ...toImageArray(req.body?.images),
      ...toImageArray(req.body?.image),
    ];

    const uploadedFiles = ["image1", "image2", "image3", "image4"]
      .flatMap((field) => (Array.isArray(req.files?.[field]) ? req.files[field] : []))
      .filter(Boolean);
    const uploadedUrls = await uploadBuffers(uploadedFiles);

    const images = [...bodyImages, ...uploadedUrls].filter(Boolean);

    const errors = [];
    if (!String(name || "").trim()) errors.push("Product name is required");
    if (!String(description || "").trim()) errors.push("Product description is required");
    if (!String(category || "").trim()) errors.push("Category is required");
    if (!String(subCategory || "").trim()) errors.push("Sub-category is required");   
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      errors.push("Price must be a positive number");
    }
    if (!images.length) {
      errors.push("At least one product image is required");
    }
    if (!sizes.length) {
      errors.push("Select at least one size");
    }

    if (errors.length) {
      return res.status(422).json({ success: false, message: errors.join("; ") });
    }

    const product = await productModel.create({
      name: String(name).trim(),
      description: String(description).trim(),
      price: priceNumber,
      category: String(category).trim(),
      subCategory: String(subCategory).trim(),
      bestseller: bestsellerBool,
      sizes,
      images,
      date: Date.now(),
    });

    const normalized = normalizeProductImages(product);
     return res.status(201).json({
      success: true,
      message: "Product added",
      data: { product: normalized },
      product: normalized,
    });
  } catch (error) {
    console.error("addProduct error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Add product failed" });
  }
};

const parsePositiveInteger = (value, defaultValue) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return defaultValue;
  return parsed;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const listProducts = async (req, res) => {
  try {
        const wantsAll = parseBoolean(req?.query?.all);
    const rawPage = req?.query?.page;
    const rawLimit = req?.query?.limit;

    const page = wantsAll ? 1 : parsePositiveInteger(rawPage, 1);
    const limit = wantsAll
      ? 0
      : clamp(parsePositiveInteger(rawLimit, 30), 1, 100);
    const skip = wantsAll ? 0 : (page - 1) * limit;

    const filter = {};
    const projection =
      "name price category subCategory bestseller images sizes description date";

    let productsQuery = productModel
      .find(filter)
      .select(projection)
      .sort({ date: -1, createdAt: -1 });

    if (!wantsAll) {
      productsQuery = productsQuery.skip(skip).limit(limit);
    }

    const [products, total] = await Promise.all([
      productsQuery.lean(),
      productModel.countDocuments(filter),
    ]);

    const normalised = products.map(normalizeProductImages);
    const totalPages = wantsAll || !limit ? 1 : Math.ceil(total / limit) || 0;
    const pagination = {
      page,
      limit: wantsAll ? total : limit,
      total,
      totalPages,
      hasMore: wantsAll ? false : page * limit < total,
    };

    return res.json({
      success: true,
      message: "Products fetched",
      data: { products: normalised, pagination },
      products: normalised,
      pagination,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const removeProduct = async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ success: false, message: "Product id is required" });
    }
    await productModel.findByIdAndDelete(id);
    return res.json({ success: true, message: "Product removed", data: { id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body || {};
    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }
    const product = await productModel.findById(productId);
     if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    const normalised = normalizeProductImages(product);
    return res.json({
      success: true,
      message: "Product fetched",
      data: { product: normalised },
      product: normalised,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTrendingProducts = async (req, res) => {
  try {
    const products = await productModel
      .find({ bestseller: true, isActive: true })
      .sort({ date: -1 })
      .limit(20);

    const normalised = products.map(normalizeProductImages);

    return res.json({ success: true, message: 'Trending products fetched', products: normalised, data: { products: normalised } });
  } catch (error) {
    console.error('[getTrendingProducts] Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch trending products' });
  }
};

export { listProducts, addProduct, removeProduct, singleProduct, getTrendingProducts };
