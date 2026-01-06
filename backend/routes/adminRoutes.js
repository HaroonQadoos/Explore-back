const express = require("express");
const router = express.Router();
const {
  getPendingUsers,
  approveUser,
  rejectUser,
  getActiveUsers,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Protect routes & only admin
router.use(protect);
router.use(adminOnly);

router.get("/pending-users", getPendingUsers);
router.patch("/approve/:id", approveUser);
router.patch("/reject/:id", rejectUser);
router.get("/active-users", getActiveUsers);

module.exports = router;
