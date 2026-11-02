const Order = require("../Models/ordermodel");

// @route   GET /api/orders
const getOrders = async (req, res) => {
  try {
    const statusFilter = req.query.status ? { status: req.query.status } : {};
    
    const orders = await Order.find({ restaurant_id: req.restaurant.id, ...statusFilter }).sort('-createdAt');
    
    res.json({
      success: true,
      data: {
        orders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurant_id: req.restaurant.id },
      { status, updated_at: new Date() },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({
      success: true,
      message: "Order status updated",
      data: {
        id: order._id,
        status: order.status,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOrders,
  updateOrderStatus,
};
