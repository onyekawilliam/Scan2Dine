const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    emoji_icon: { type: String, default: "🍽️" },
    display_order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ restaurant_id: 1, display_order: 1 });

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
