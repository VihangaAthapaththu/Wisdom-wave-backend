const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middlewares/authMiddleware");
const { getStats } = require("../controllers/admin.controller");

router.use(protect);

router.get("/stats", authorize("ADMIN"), getStats);

module.exports = router;
