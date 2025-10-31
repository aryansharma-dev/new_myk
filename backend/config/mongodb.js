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
    process.exit(1);
  }
};

export default connectDB;