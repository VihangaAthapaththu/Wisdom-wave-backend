const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  createPayment,
  getAllPayments,
  getMyPayments,
  confirmPayment,
  failPayment,
} = require("../controllers/payment.controller");

router.use(protect);

router.post("/", authorize("STUDENT"), createPayment);
router.get("/", authorize("ADMIN"), getAllPayments);
router.get("/mine", authorize("STUDENT"), getMyPayments);
router.put("/:id/confirm", authorize("ADMIN"), confirmPayment);
router.put("/:id/fail", authorize("ADMIN"), failPayment);

module.exports = router;
