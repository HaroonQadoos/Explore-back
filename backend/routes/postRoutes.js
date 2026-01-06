const express = require("express");
const router = express.Router();
const {
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  createPost,
  getMyPosts,
  togglePublishPosts,
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const Post = require("../models/post");
const upload = require("../middleware/uploadMiddleware");

//admin
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  const posts = await Post.find()
    .populate("author", "username")
    .sort({ createdAt: -1 });

  res.json(posts);
});
router.put("/:id/publish", protect, adminOnly, togglePublishPosts);

//Public
router.get("/", getPosts);
router.get("/:id", getPostById);
//users
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  // Send back URL for Quill editor
  res.json({ url: `http://localhost:4000/uploads/${req.file.filename}` });
});
router.get("/my-posts", protect, getMyPosts);
router.post("/", protect, upload.single("image"), createPost); //protected
router.put("/:id", protect, updatePost); //protected
router.delete("/:id", protect, deletePost); //protected

module.exports = router;
