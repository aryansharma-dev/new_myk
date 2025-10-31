import Razorpay from "razorpay";
import crypto from "crypto";
import Stripe from "stripe";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";

const stripeSecret = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

const frontendBase = (process.env.FRONTEND_URL || process.env.BASE_URL || "http://localhost:5173").replace(/\/$/, "");
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpayClient = razorpayKeyId && razorpayKeySecret ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret }) : null;

const maskValue = (value = "") => {
  if (!value) return "<missing>";
  if (value.length <= 10) return `${value.slice(0, 4)}…`;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
};

const normaliseOrder = (order) => (order && typeof order.toObject === "function" ? order.toObject() : order);

const normalisePaymentMethod = (value, fallback = "COD") => {
  const safe = String(value || "").trim();
  if (!safe) return fallback;

  switch (safe.toLowerCase()) {
    case "cod":
      return "COD";
    case "stripe":
      return "Stripe";
    case "razorpay":
      return "Razorpay";
    default:
      return safe;
  }
};

const pickProductId = (item = {}) => {
  const candidates = [item.product, item.productId, item._id, item.id];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const id = String(candidate).trim();
    if (id) return id;
  }
  return "";
};

const extractImageFromItem = (item = {}) => {
  if (typeof item.image === "string" && item.image.trim()) return item.image.trim();
  if (Array.isArray(item.image)) {
    const first = item.image.find((img) => typeof img === "string" && img.trim());
    if (first) return first.trim();
  }
  return "";
};

const extractPrimaryImageFromProduct = (product = {}) => {
  if (Array.isArray(product.images) && product.images.length) {
    const first = product.images.find((img) => typeof img === "string" && img.trim());
    if (first) return first.trim();
  }
  if (typeof product.image === "string" && product.image.trim()) {
    return product.image.trim();
  }
  return "";
};

const enrichCartItems = async (items = []) => {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return [];

  const productIds = Array.from(
    new Set(
      list
        .map((item) => pickProductId(item))
        .filter((id) => id)
    )
  );

  let products = [];
  if (productIds.length) {
    products = await productModel
      .find({ _id: { $in: productIds } })
      .select("name price images image")
      .lean();
  }

  const productLookup = new Map();
  products.forEach((product) => {
    if (product?._id) {
      productLookup.set(String(product._id), product);
    }
  });

  return list
    .map((item) => {
      const productId = pickProductId(item);
      if (!productId) return null;
      const product = productLookup.get(productId) || {};
      const quantityRaw = item?.quantity ?? item?.qty ?? 0;
      const quantity = Number(quantityRaw);
      if (!Number.isFinite(quantity) || quantity <= 0) return null;
      const priceRaw = Number(item?.price ?? product?.price ?? 0);
      const price = Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : 0;
      const sizeValue = item?.size ?? item?.variant ?? "nosize";
      const name = item?.name || product?.name || "Product";
      const image = extractImageFromItem(item) || extractPrimaryImageFromProduct(product) || undefined;

      return {
        product: productId,
        name,
        price,
        size: String(sizeValue || "nosize"),
        quantity,
        image,
      };
    })
    .filter(Boolean);
};

export const placeOrder = async (req, res) => {
  try {
    const { cartItems, totalAmount, address, paymentMethod } = req.body;
    const resolvedMethod = normalisePaymentMethod(paymentMethod, "COD");
    const rawItems = Array.isArray(cartItems) && cartItems.length ? cartItems : req.body?.items || [];
    const enrichedItems = await enrichCartItems(rawItems);

    const newOrder = await orderModel.create({
      user: req.user.id,
      cartItems: enrichedItems,
      totalAmount,
      address,
      paymentMethod: resolvedMethod,
      status: "Pending",
      date: Date.now(),
    });

    return res.json({
      success: true,
      message: "Order placed",
      data: { order: normaliseOrder(newOrder) },
      order: newOrder,
    });
  } catch (err) {
    console.error("placeOrder error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const placeOrderStripe = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ success: false, message: "Stripe is not configured" });
    }
    const { cartItems, totalAmount, address } = req.body;
    const rawItems = Array.isArray(cartItems) && cartItems.length ? cartItems : req.body?.items || [];
    const enrichedItems = await enrichCartItems(rawItems);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: enrichedItems.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: { name: item.name },
          unit_amount: Math.round(Number(item.price || 0) * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${frontendBase}/order-success`,
      cancel_url: `${frontendBase}/cart`,
      metadata: { userId: req.user.id },
    });

    const newOrder = await orderModel.create({
      user: req.user.id,
      cartItems: enrichedItems,
      totalAmount,
      address,
      paymentMethod: normalisePaymentMethod("Stripe", "Stripe"),
      status: "Initiated",
      stripeSessionId: session.id,
      date: Date.now(),
    });

      return res.json({
      success: true,
      message: "Stripe checkout created",
      data: { session_url: session.url, session_id: session.id, order: normaliseOrder(newOrder) },
      session_url: session.url,
      session_id: session.id,
    });
  } catch (err) {
    console.error("placeOrderStripe error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const placeOrderRazorpay = async (req, res) => {
  try {
    const { cartItems, totalAmount, address } = req.body;
    const rawItems = Array.isArray(cartItems) && cartItems.length ? cartItems : req.body?.items || [];
    const enrichedItems = await enrichCartItems(rawItems);

    if (!razorpayClient) {
      const mockOrder = await orderModel.create({
        user: req.user.id,
        cartItems: enrichedItems,
        totalAmount,
        address,
        paymentMethod: normalisePaymentMethod("Razorpay", "Razorpay"),
        status: "Paid",
        date: Date.now(),
      });
      return res.json({
        success: true,
        message: "Razorpay not configured. Mock order created.",
        data: { mock: true, order: normaliseOrder(mockOrder) },
      });
    }

    const amountPaise = Math.max(0, Math.round(Number(totalAmount || 0) * 100));
    const order = await razorpayClient.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    const newOrder = await orderModel.create({
      user: req.user.id,
      cartItems: enrichedItems,
      totalAmount,
      address,
      paymentMethod: normalisePaymentMethod("Razorpay", "Razorpay"),
      status: "Initiated",
      razorpayOrderId: order.id,
      date: Date.now(),
    });

     return res.json({
      success: true,
      message: "Razorpay order created",
      data: { order, key: razorpayKeyId, record: normaliseOrder(newOrder) },
      order,
      key: razorpayKeyId,
    });
  } catch (err) {
    console.error("placeOrderRazorpay error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyStripe = async (req, res) => {
  try {
      if (!stripe) {
      return res.status(503).json({ success: false, message: "Stripe is not configured" });
    }
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      await orderModel.findOneAndUpdate({ stripeSessionId: sessionId }, { status: "Paid" });
      return res.json({ success: true, message: "Payment verified" });
    }

    return res.status(400).json({ success: false, message: "Payment not completed" });
  } catch (err) {
    console.error("verifyStripe error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpayClient) {
      return res.json({ success: true, message: "Razorpay mock verification accepted" });
    }

    const hmac = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (hmac !== razorpay_signature) {
        console.error("verifyRazorpay error: Invalid signature", {
        header: maskValue(razorpay_signature),
        expectedPrefix: maskValue(hmac),
      });
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    await orderModel.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: "Paid" });

    return res.json({ success: true, message: "Payment verified" });
  } catch (err) {
    console.error("verifyRazorpay error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const allOrders = async (_req, res) => {
  try {
    const orders = await orderModel.find().populate("user", "email");
    return res.json({ success: true, message: "Orders fetched", data: { orders }, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ user: req.user.id });
    return res.json({ success: true, message: "Orders fetched", data: { orders }, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }
    await orderModel.findByIdAndUpdate(orderId, { status });
    return res.json({ success: true, message: "Order status updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};