const Order = require("../Models/ordermodel");
const { isObjectId, fail, serverError, notFound } = require("../utils/http");

const STATUSES = ["pending", "accepted", "preparing", "ready", "completed", "cancelled"];

// Which status an order may move to from its current one. Completed and cancelled are final.
// "pending -> preparing" is allowed so a kitchen that skips the accept step still works.
const TRANSITIONS = {
  pending: ["accepted", "preparing", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

// @route   GET /api/orders?status=pending&limit=100&page=1
const getOrders = async (req, res) => {
  try {
    const filter = { restaurant_id: req.restaurant.id };

    // Only accept a plain string from the enum: blocks query-object injection like ?status[$ne]=x
    if (typeof req.query.status === "string") {
      if (!STATUSES.includes(req.query.status)) {
        return fail(res, 400, "VALIDATION_ERROR", "Unknown order status");
      }
      filter.status = req.query.status;
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const [orders, total] = await Promise.all([
      Order.find(filter).sort("-createdAt").skip((page - 1) * limit).limit(limit),
      Order.countDocuments(filter),
    ]);

    res.json({ success: true, data: { orders, page, limit, total } });
  } catch (error) {
    serverError(res, error);
  }
};

// @route   PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!isObjectId(req.params.id)) return notFound(res, "Order");

    const order = await Order.findOne({ _id: req.params.id, restaurant_id: req.restaurant.id });
    if (!order) return notFound(res, "Order");

    if (!TRANSITIONS[order.status].includes(status)) {
      return fail(res, 409, "INVALID_TRANSITION", `An order that is ${order.status} cannot be marked ${status}`);
    }

    // Conditioning on the old status makes the change atomic if two staff tap at the same moment.
    const update = { status };
    if (status === "completed") update.completed_at = new Date();
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, restaurant_id: req.restaurant.id, status: order.status },
      { $set: update },
      { new: true }
    );
    if (!updated) {
      return fail(res, 409, "CONFLICT", "This order was just updated by someone else. Refresh and try again.");
    }

    const io = req.app.get("io");
    if (io) io.to(String(req.restaurant.id)).emit("order_updated", { id: updated._id, status: updated.status });

    res.json({
      success: true,
      message: "Order status updated",
      data: { id: updated._id, status: updated.status },
    });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = { getOrders, updateOrderStatus };
