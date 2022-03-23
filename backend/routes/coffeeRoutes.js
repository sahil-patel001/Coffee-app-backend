const express = require("express");
const router = express.Router();
const {
  addCoffee,
  getAllCoffee,
  orderCoffee,
  fetchAllOrder,
  coffeeRecommandation,
  rateCoffee,
} = require("../controllers/coffeeController.js");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getAllCoffee);
router.post("/add", protect, addCoffee);
router.post("/order", protect, orderCoffee);
router.get("/allOrder", protect, fetchAllOrder);
router.get("/recommanded-coffee", protect, coffeeRecommandation);
router.post("/rate-coffee", protect, rateCoffee);

module.exports = router;
