const express = require("express");
const router = express.Router();
const { generateQR } = require("../Controllers/qrcontroller");
const { protect } = require("../Middleware/authMiddleware");

router.get("/generate", protect, generateQR);

module.exports = router;
