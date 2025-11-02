import mongoose from "mongoose";

const miniStoreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    slug: { type: String, required: true, unique: true }, // URL: /gopalji
    displayName: { type: String, required: true }, // Store name
    bio: String,
    avatarUrl: String,
    bannerUrl: String,
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const MiniStore = mongoose.models.MiniStore || mongoose.model("MiniStore", miniStoreSchema);

export default MiniStore;