const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const {
  createPayment,
  getAllPayments,
  getMyPayments,
  getPayment,
  confirmPayment,
  failPayment,
  verifySession,
} = require("../controllers/payment.controller");

router.use(protect);

router.post("/", authorize("STUDENT"), createPayment);
router.get("/", authorize("ADMIN"), getAllPayments);
router.get("/mine", authorize("STUDENT"), getMyPayments);
router.get("/:id", authorize("STUDENT", "ADMIN"), getPayment);
router.put("/:id/confirm", authorize("ADMIN"), confirmPayment);
router.put("/:id/fail", authorize("ADMIN"), failPayment);
router.post("/:id/verify-session", authorize("STUDENT", "ADMIN"), verifySession);

module.exports = router;
