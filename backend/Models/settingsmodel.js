const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, unique: true },
    business_hours: { type: Object, default: {} }, // e.g. {"monday": {"open": "09:00", "close": "22:00"}}
    currency: { type: String, default: "USD" },
    tax_rate: { type: Number, default: 0 },
    enable_table_ordering: { type: Boolean, default: true },
    enable_takeout: { type: Boolean, default: true },
    enable_delivery: { type: Boolean, default: false },
    min_order_amount: { type: Number },
    notification_email: { type: String },
    notification_phone: { type: String },
    theme_color: { type: String, default: "#667eea" },
  },
  { timestamps: true }
);

const RestaurantSettings = mongoose.model("RestaurantSettings", settingsSchema);
module.exports = RestaurantSettings;
