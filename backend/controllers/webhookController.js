import Stripe from "stripe";
import crypto from "crypto";

import orderModel from "../models/orderModel.js";

const stripeSecret = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

const maskHeader = (value = "") => {
  if (!value) return "<missing>";
  if (value.length <= 10) return `${value.slice(0, 4)}…`;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
};

export const stripeWebhookHandler = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.error(
      "[Stripe webhook] Missing secrets:",
      JSON.stringify({
        hasStripeSecret: Boolean(stripeSecret),
        hasWebhookSecret: Boolean(webhookSecret),
      })
    );
    return res.status(500).send("Stripe webhook misconfigured");
  }

   if (!signature) {
    console.error("[Stripe webhook] Missing signature header");
    return res.status(400).send("Missing Stripe-Signature header");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe webhook] Invalid signature", {
      header: maskHeader(signature),
      hasWebhookSecret: Boolean(webhookSecret),
      rawBodyType: req.body instanceof Buffer ? "buffer" : typeof req.body,
        rawBodyLength: req.body?.length ?? null,
      reason: err.code || err.type || "unknown",
      message: err.message,
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      await orderModel.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: "Paid" }
      );
    } catch (dbErr) {
      console.error("[Stripe webhook] Failed to update order", dbErr);
    }
  }

  return res.json({ received: true });
};

export const razorpayWebhookHandler = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Razorpay webhook] Missing webhook secret");
    return res.status(500).json({
      success: false,
      message: "Razorpay webhook misconfigured",
    });
  }

   if (!signature) {
    console.error("[Razorpay webhook] Missing signature header");
    return res.status(400).json({
      success: false,
      message: "Missing X-Razorpay-Signature header",
    });
  }

  const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.error("[Razorpay webhook] Invalid signature", {
      header: maskHeader(signature),
      expectedPrefix: maskHeader(expectedSignature),
      hasWebhookSecret: Boolean(webhookSecret),
      rawBodyLength: payload.length,
      bodyPreview: payload.slice(0, 64),
    });
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  let event;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    console.error("[Razorpay webhook] Failed to parse payload", err.message);
    return res.status(400).json({ success: false, message: "Invalid payload" });
  }

  const eventType = event.event;
  const paymentEntity = event.payload?.payment?.entity;
  const orderId =
    paymentEntity?.order_id || event.payload?.order?.entity?.id || null;

  if (orderId && (eventType === "payment.captured" || eventType === "order.paid")) {
    try {
      await orderModel.findOneAndUpdate(
        { razorpayOrderId: orderId },
        { status: "Paid" }
      );
    } catch (dbErr) {
      console.error("[Razorpay webhook] Failed to update order", dbErr);
    }
  }

  return res.json({ success: true });
};