import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    images: { type: [String], required: true },   // jo tum use karte ho uske hisaab se
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    sizes: { type: [String], required: true }, 
    bestseller: { type: Boolean, default: false },
    date: { type: Number, required: true },
    stock: { type: Number, default: 0 },

    // ✅ SEO/Indexing helpers
    slug: { type: String, index: true, unique: true, sparse: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true } // ✅ brings createdAt, updatedAt
);

// ✅ Auto-slug (unique)
productSchema.pre("validate", async function (next) {
  if (!this.isModified("name") && this.slug) return next();

  const base = slugify(this.name || "", { lower: true, strict: true }) || this._id.toString();
  let candidate = base, i = 0;

  while (await mongoose.model("Product").exists({ slug: candidate, _id: { $ne: this._id } })) {
    i += 1;
    candidate = `${base}-${i}`;
  }
  this.slug = candidate;
  next();
});

// (optional) helpful index
productSchema.index({ slug: 1 }, { unique: true, sparse: true });

// ⚠️ Model name exactly "Product" rakho
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;