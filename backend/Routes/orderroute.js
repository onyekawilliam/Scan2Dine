const express = require("express");
const router = express.Router();
const { getOrders, updateOrderStatus } = require("../Controllers/ordercontroller");
const { protect } = require("../Middleware/authMiddleware");
const validate = require("../Middleware/validateMiddleware");
const { orderStatusSchema } = require("../utils/validationSchemas");

router.route("/").get(protect, getOrders);
router.route("/:id/status").put(protect, validate(orderStatusSchema), updateOrderStatus);

module.exports = router;
