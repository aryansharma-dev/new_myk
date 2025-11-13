import express from "express";
import validator from "validator";

import Newsletter from "../models/newsletterModel.js";

const router = express.Router();

// @route   POST /api/newsletter/subscribe
// @desc    Subscribe user to newsletter
// @access  Public
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email" });
    }

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already subscribed" })
    }

    await Newsletter.create({ email: normalizedEmail });

    res.status(201).json({ success: true, message: "Subscription successful" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already subscribed" });
    }

    if (error?.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;