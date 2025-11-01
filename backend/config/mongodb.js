import mongoose from "mongoose";

const connectDB = async () => {
  if (process.env.SKIP_DB === "true") {
    console.warn("⚠️  SKIP_DB enabled. Skipping MongoDB connection for local development.");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "tinymillion" });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("MongoDB error:", err.message);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    console.warn("⚠️  Continuing without MongoDB connection in non-production mode.");
    // Fixed: avoid crashing local dev when MongoDB isn't reachable.
  }
};

export default connectDB;