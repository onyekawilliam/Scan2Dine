const express = require("express");
const router = express.Router();
const { getDashboardStats } = require("../Controllers/analyticscontroller");
const { protect } = require("../Middleware/authMiddleware");

router.get("/dashboard", protect, getDashboardStats);

module.exports = router;
