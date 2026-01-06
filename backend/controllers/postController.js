const { default: api } = require("../../frontend/src/api/axios");
const Post = require("../models/post");
const mongoose = require("mongoose");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/* =======================
   VISITOR
======================= */

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: "published" })
      .populate("author", "username email")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error loading posts" });
  }
};

const getPostById = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Post ID is required" });
  if (!isValidId(id))
    return res.status(400).json({ message: "Invalid post ID" });

  try {
    const post = await Post.findOne({ _id: id, status: "published" }).populate(
      "author",
      "username _id"
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching post" });
  }
};

/* =======================
   USER
======================= */

const getMyPosts = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });

    const posts = await Post.find({ author: req.user._id })
      .populate("author", "username")
      .sort({
        createdAt: -1,
      });

    const postsWithFullUrl = posts.map((post) => ({
      ...post._doc,
      image: post.image
        ? post.image.startsWith("http")
          ? post.image
          : `http://localhost:4000${post.image}`
        : "",
    }));

    res.json(postsWithFullUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error loading your posts" });
  }
};

const createPost = async (req, res) => {
  try {
    const { title, body, htmlBody, status, tags } = req.body;
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });

    // strict field validation
    if (!title || !title.trim())
      return res.status(400).json({ message: "Title is required" });

    if (!body || !body.trim())
      return res.status(400).json({ message: "Body is required" });

    const image = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.imageUrl || "";

    const validStatus = ["draft", "published"];
    const postStatus = validStatus.includes(status) ? status : "draft";

    const post = await Post.create({
      title,
      body,
      htmlBody: htmlBody || body,
      author: req.user._id,
      image,
      status: postStatus,
      tags: Array.isArray(tags) ? tags : [],
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating post" });
  }
};

const updatePost = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Post ID is required" });
  if (!isValidId(id))
    return res.status(400).json({ message: "Invalid post ID" });

  if (!req.body)
    return res.status(400).json({ message: "Request body is required" });

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    )
      return res.status(403).json({ message: "Not authorized" });

    const { title, body, image, tags, status } = req.body;

    if (title !== undefined && !title.trim())
      return res.status(400).json({ message: "Title cannot be empty" });

    if (body !== undefined && !body.trim())
      return res.status(400).json({ message: "Body cannot be empty" });

    post.title = title ?? post.title;
    post.body = body ?? post.body;
    post.image = image ?? post.image;
    post.tags = Array.isArray(tags) ? tags : post.tags;

    const validStatus = ["draft", "published"];
    if (status && validStatus.includes(status)) post.status = status;

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Error updating post" });
  }
};

const deletePost = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Post ID is required" });
  if (!isValidId(id))
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting post" });
  }
};

/* =======================
   ADMIN
======================= */

const togglePublishPosts = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Post ID is required" });
  if (!isValidId(id))
    return res.status(400).json({ message: "Invalid post ID" });

  try {
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.status = post.status === "published" ? "draft" : "published";
    await post.save();

    res.json({ message: `Post ${post.status}`, status: post.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error toggling post status" });
  }
};

module.exports = {
  getPosts,
  getPostById,
  getMyPosts,
  createPost,
  updatePost,
  deletePost,
  togglePublishPosts,
};
