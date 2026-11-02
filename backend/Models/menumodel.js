const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true, index: true },
    description: { type: String },
    price: { type: Number, required: true },
    image_url: { type: String },
    emoji_icon: { type: String, default: '🍽️' },
    is_available: { type: Boolean, default: true },
    is_featured: { type: Boolean, default: false },
    allergens: [{ type: String }],
    dietary_tags: [{ type: String }],
    preparation_time: { type: Number }, // in minutes
    display_order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurant_id: 1, category_id: 1 });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
module.exports = MenuItem;
