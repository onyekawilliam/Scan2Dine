const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menu_item_id: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  item_name: { type: String, required: true },
  item_price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  special_instructions: { type: String },
  subtotal: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    order_number: { type: String, required: true, unique: true, index: true },
    customer_name: { type: String },
    customer_phone: { type: String },
    customer_email: { type: String },
    table_number: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    special_instructions: { type: String },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    payment_method: {
      type: String,
      enum: ["cash", "card", "online"],
    },
    completed_at: { type: Date },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
