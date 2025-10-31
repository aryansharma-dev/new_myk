import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // optional
    name: String,
    price: Number,
    size: String,
    quantity: Number,
    image: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // NEW (preferred by controllers):
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // controller expects req.user.id here
    cartItems: [itemSchema],
    totalAmount: { type: Number },

    // Legacy compatibility (from your old model):
    userId: { type: String },             // old
    items: { type: Array },               // old
    amount: { type: Number },             // old

    address: { type: Object, required: true },

    paymentMethod: {
      type: String,
      enum: ["COD", "Stripe", "Razorpay"],
      required: true,
    },

    // Unified status set; includes legacy "Order Placed"
    status: {
      type: String,
      enum: ["Pending", "Initiated", "Paid", "Shipped", "Delivered", "Cancelled", "Order Placed"],
      default: "Pending",
    },

    // Payment flags/ids
    payment: { type: Boolean, default: false }, // legacy field; keep for compatibility
    stripeSessionId: { type: String },
    razorpayOrderId: { type: String },

    // Timestamps
    date: { type: Number }, // legacy numeric date
  },
  { timestamps: true }
);

/**
 * Pre-save sync:
 * - If only legacy fields provided, copy to new fields (amount -> totalAmount, items -> cartItems).
 * - If only new fields provided, mirror to legacy for backward-compat (optional).
 */
orderSchema.pre("save", function (next) {
  // If controller provided new fields, make sure legacy mirrors exist (optional)
  if (this.totalAmount != null && this.amount == null) this.amount = this.totalAmount;
  if (Array.isArray(this.cartItems) && !this.items?.length) this.items = this.cartItems;

  // If legacy fields provided (from older code paths), fill the new ones
  if ((this.totalAmount == null) && (this.amount != null)) this.totalAmount = this.amount;
  if ((!this.cartItems || this.cartItems.length === 0) && Array.isArray(this.items) && this.items.length > 0) {
    // try to coerce legacy plain items -> itemSchema shape if needed
    this.cartItems = this.items.map((it) => {
      if (typeof it === "object" && it !== null) {
        return {
          product: it.product || it.productId || undefined,
          name: it.name,
          price: it.price,
          size: it.size,
          quantity: it.quantity || it.qty || 1,
          image:
            typeof it.image === "string"
              ? it.image
              : Array.isArray(it.image) && it.image.length
              ? it.image[0]
              : undefined,     
        };
      }
      return it;
    });
  }

  // Prefer new "user" field; if missing but userId exists, keep userId (don’t guess ObjectId)
  // Controllers should set `user` (ObjectId). If you still use userId in old paths, it will remain.
  next();
});

// Use a stable collection/model name ("orders")
const orderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default orderModel;
