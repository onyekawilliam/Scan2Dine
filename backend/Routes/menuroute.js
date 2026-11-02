const express = require("express");
const router = express.Router();
const { getCategories, createCategory, getMenuItems, createMenuItem } = require("../Controllers/menucontroller");
const { protect } = require("../Middleware/authMiddleware");
const validate = require("../Middleware/validateMiddleware");
const { menuItemSchema } = require("../utils/validationSchemas");

router.route("/categories").get(protect, getCategories).post(protect, createCategory);
router.route("/items").get(protect, getMenuItems).post(protect, validate(menuItemSchema), createMenuItem);

module.exports = router;
