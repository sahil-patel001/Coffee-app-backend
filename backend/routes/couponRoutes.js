const express = require("express");
const { generateCode } = require("../controllers/couponCodeController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/generate-coupon-code", protect, generateCode)

module.exports = router