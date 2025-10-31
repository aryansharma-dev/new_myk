import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

// Routes
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";          
import orderRouter from "./routes/orderRoute.js";
import newsletterRoute from "./routes/newsletterRoute.js"; 
import seoRoutes from "./routes/seo.routes.js";            
import miniStoreRoutes from "./routes/miniStoreRoutes.js";
import legacyMiniStoreRoutes from "./routes/legacyMiniStoreRoutes.js";
import subadminRoutes from "./routes/subadminRoutes.js";  // ✅ Sub-admin routes added

import {
  razorpayWebhookHandler,
  stripeWebhookHandler,
} from "./controllers/webhookController.js"

const app = express();
const port = process.env.PORT || 4000;

// Guard required env vars early
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter(
  (key) => !process.env[key] || process.env[key].toString().trim() === ""
);

if (missingEnvVars.length) {
  console.error(
    `❌ Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

// DB + Cloudinary
connectDB();
connectCloudinary();

// Trust proxy (Render/NGINX)
app.set("trust proxy", 1);

// ✅ FIXED CORS Configuration
const staticAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",  // Common dev port (from Folder 2)
  "http://localhost:4000",  // Common dev port (from Folder 1)
  "https://tinymillion.com",
  "https://www.tinymillion.com",
  "https://admin.tinymillion.com",
  "https://www.admin.tinymillion.com",
  "https://tinymillion.onrender.com",
];

const envAllowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

const allowedOrigins = Array.from(
  new Set([...staticAllowedOrigins, ...envAllowedOrigins])
);

const corsOptions = {
  origin(origin, callback) {
    // ✅ Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // ✅ Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // ✅ In development, allow localhost with any port
    if (process.env.NODE_ENV !== "production" && origin.startsWith("http://localhost:")) {
      console.info(`🔓 Dev mode: Allowing origin ${origin}`);
      return callback(null, true);
    }
    
    // ❌ Block unauthorized origins
    console.warn(`⚠️ Blocked origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "token", "x-seed-key"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// ✅ Apply CORS globally
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// 🔑 Enable cookies
app.use(cookieParser());

// Webhooks must read the raw request body for signature verification
app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);
app.post(
  "/webhook/razorpay",
  express.raw({ type: "application/json" }),
  razorpayWebhookHandler
);

// Body parsers (larger limits for images/forms)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Health checks
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

// API routes
app.use("/admin/mini-store", legacyMiniStoreRoutes);  // Legacy routes (from Folder 1)
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/newsletter", newsletterRoute);
app.use("/api/ministores", miniStoreRoutes);
app.use("/api/subadmin", subadminRoutes);  // ✅ Sub-admin routes mounted

// SEO + health
app.use("/", seoRoutes);
app.get("/", (_req, res) => res.send("✅ API Working Fine"));

// Global error handler for CORS errors
app.use((err, req, res, next) => {
  if (err.message.includes("not allowed by CORS")) {
    return res.status(403).json({ 
      message: "CORS Error: Origin not allowed",
      origin: req.headers.origin 
    });
  }
  next(err);
});

// Start
app.listen(port, () => console.info(`🚀 Server started on PORT: ${port}`));