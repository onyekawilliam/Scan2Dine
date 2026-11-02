const express = require("express");
const router = express.Router();
const { getOrders, updateOrderStatus } = require("../Controllers/ordercontroller");
const { protect } = require("../Middleware/authMiddleware");

router.route("/").get(protect, getOrders);
router.route("/:id/status").put(protect, updateOrderStatus);

module.exports = router;
