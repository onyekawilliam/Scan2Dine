const express = require("express");
const router = express.Router();
const { registerRestaurant, loginRestaurant, getMe, updateProfile } = require("../Controllers/authcontroller");
const { protect } = require("../Middleware/authMiddleware");
const validate = require("../Middleware/validateMiddleware");
const { registerSchema, loginSchema } = require("../utils/validationSchemas");

router.post("/register", validate(registerSchema), registerRestaurant);
router.post("/login", validate(loginSchema), loginRestaurant);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

module.exports = router;
