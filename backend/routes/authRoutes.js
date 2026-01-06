const express = require("express");
const router = express.Router();

const {
  registeredUser,
  loginUser,
  logoutUser,
  getUsers,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

/// adminOnly
router.get("/", protect, adminOnly, getUsers);

router.get("/me", protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
    status: req.user.status,
  }); // req.user is set in protect middleware
});
router.post("/register", registeredUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

module.exports = router;
