const express = require("express");
const router = express.Router();
const c = require("../Controllers/menucontroller");
const { protect } = require("../Middleware/authMiddleware");
const validate = require("../Middleware/validateMiddleware");
const {
  categorySchema,
  categoryUpdateSchema,
  categoryReorderSchema,
  menuItemSchema,
  menuItemUpdateSchema,
} = require("../utils/validationSchemas");

router.use(protect);

router.route("/categories").get(c.getCategories).post(validate(categorySchema), c.createCategory);
// Must be declared before "/categories/:id" or "reorder" would be read as an id.
router.put("/categories/reorder", validate(categoryReorderSchema), c.reorderCategories);
router.route("/categories/:id").put(validate(categoryUpdateSchema), c.updateCategory).delete(c.deleteCategory);

router.route("/items").get(c.getMenuItems).post(validate(menuItemSchema), c.createMenuItem);
router.route("/items/:id").put(validate(menuItemUpdateSchema), c.updateMenuItem).delete(c.deleteMenuItem);

module.exports = router;
