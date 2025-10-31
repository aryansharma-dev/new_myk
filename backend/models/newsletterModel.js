import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // Prevent duplicate emails
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"], // Basic validation
    },
  },
  { timestamps: true } // Automatically add createdAt & updatedAt
);

const Newsletter = mongoose.model("Newsletter", newsletterSchema);

export default Newsletter;
