import mongoose from "mongoose";

const miniStoreSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true }, // URL: /gopalji
    displayName: { type: String, required: true },        // Store name
    bio: String,
    avatarUrl: String,
    bannerUrl: String,
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("MiniStore", miniStoreSchema);