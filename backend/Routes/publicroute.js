const express = require("express");
const router = express.Router();
const { getPublicMenu, placeOrder, getOrderStatus } = require("../Controllers/publiccontroller");
const validate = require("../Middleware/validateMiddleware");
const { orderSchema } = require("../utils/validationSchemas");

router.get("/menu/:restaurant_slug", getPublicMenu);
router.get("/orders/:id", getOrderStatus);
router.post("/orders", validate(orderSchema), placeOrder);

module.exports = router;
