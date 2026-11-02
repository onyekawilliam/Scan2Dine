const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    restaurant_name: { type: String, required: true, index: true },
    owner_name: { type: String, required: true },
    email: { type: String, unique: true, required: true, index: true },
    password_hash: { type: String, required: true },
    phone: { type: String },
    slug: { type: String, unique: true, index: true },
    address: { type: String },
    description: { type: String },
    logo_url: { type: String },
    qr_code_url: { type: String },
    qr_style: {
      type: String,
      enum: ["standard", "colorful", "with_logo"],
      default: "standard",
    },
    is_active: { type: Boolean, default: true },
    subscription_tier: {
      type: String,
      enum: ["free", "basic", "premium"],
      default: "free",
    },
  },
  { timestamps: true }
);

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
module.exports = Restaurant;
