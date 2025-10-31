import express from "express";
import Newsletter from "../models/newsletterModel.js";

const router = express.Router();

// @route   POST /api/newsletter/subscribe
// @desc    Subscribe user to newsletter
// @access  Public
router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already subscribed" });
    }

    // Save new subscriber
    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();

    res.status(201).json({ success: true, message: "Subscription successful" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;