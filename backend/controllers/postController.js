const Post = require("../models/post");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// Helper
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Cloudinary upload helper
const uploadBufferToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "blog-posts" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

/* =======================
   CREATE POST
======================= */
const createPost = async (req, res) => {
  try {
    const { title, body, htmlBody, status, tags } = req.body;

    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    if (!title?.trim())
      return res.status(400).json({ message: "Title is required" });
    if (!body?.trim())
      return res.status(400).json({ message: "Body is required" });

    let image = null;

    // 1️⃣ If user uploaded a file
    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer);
      image = result.secure_url;
    }
    // 2️⃣ If user provided external URL
    else if (req.body.fileUrl) {
      image = req.body.fileUrl;
    }

    const validStatus = ["draft", "published"];
    const postStatus = validStatus.includes(status) ? status : "draft";

    const post = await Post.create({
      title,
      body,
      htmlBody: htmlBody || body,
      author: req.user._id,
      image,
      status: postStatus,
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags.split(",").map((t) => t.trim())
        : [],
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("CREATE POST ERROR:", err);
    res
      .status(500)
      .json({ message: "Error creating post", error: err.message });
  }
};

/* =======================
   UPDATE POST
======================= */
const updatePost = async (req, res) => {
  const { id } = req.params;
  if (!id || !isValidId(id))
    return res.status(400).json({ message: "Invalid post ID" });

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    )
      return res.status(403).json({ message: "Not authorized" });

    const { title, body, tags, status } = req.body;

    // Update image if new file uploaded
    let image = post.image;
    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer);
      image = result.secure_url;
    } else if (req.body.fileUrl) {
      image = req.body.fileUrl;
    }

    post.title = title ?? post.title;
    post.body = body ?? post.body;
    post.image = image;
    post.tags = Array.isArray(tags)
      ? tags
      : typeof tags === "string"
      ? tags.split(",").map((t) => t.trim())
      : post.tags;

    const validStatus = ["draft", "published"];
    if (status && validStatus.includes(status)) post.status = status;

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("UPDATE POST ERROR:", err);
    res
      .status(500)
      .json({ message: "Error updating post", error: err.message });
  }
};

/* =======================
   GET POSTS
======================= */
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "published" })
      .populate("author", "username email")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching posts" });
  }
};

const getPostById = async (req, res) => {
  const { id } = req.params;
  if (!id || !isValidId(id))
    return res.status(400).json({ message: "Invalid post ID" });

  try {
    const post = await Post.findOne({ _id: id, status: "published" }).populate(
      "author",
      "username"
    );
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching post" });
  }
};

const getMyPosts = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });
    const posts = await Post.find({ author: req.user._id })
      .populate("author", "username")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error loading your posts" });
  }
};

/* =======================
   DELETE POST
======================= */
const deletePost = async (req, res) => {
  const { id } = req.params;
  if (!id || !isValidId(id))
    return res.status(400).json({ message: "Invalid post ID" });

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    )
      return res.status(403).json({ message: "Not authorized" });

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting post" });
  }
};

/* =======================
   TOGGLE PUBLISH (ADMIN)
======================= */
const togglePublishPosts = async (req, res) => {
  const { id } = req.params;
  if (!id || !isValidId(id))
    return res.status(400).json({ message: "Invalid post ID" });

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.status = post.status === "published" ? "draft" : "published";
    await post.save();

    res.json({ message: `Post ${post.status}`, status: post.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error toggling post status" });
  }
};

module.exports = {
  createPost,
  updatePost,
  getPosts,
  getPostById,
  getMyPosts,
  deletePost,
  togglePublishPosts,
};
