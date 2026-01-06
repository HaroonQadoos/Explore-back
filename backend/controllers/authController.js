const User = require("../models/UserModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ADMIN

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select(
      "username email role status createdAt"
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// AUTH

const registeredUser = async (req, res) => {
  try {
    let { username, email, password } = req.body;

    // Strict field validation
    if (!username || !username.trim())
      return res.status(400).json({ message: "Username is required" });

    if (!email || !email.trim())
      return res.status(400).json({ message: "Email is required" });

    if (!password || !password.trim())
      return res.status(400).json({ message: "Password is required" });

    email = email.toLowerCase();

    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });

    const userExist = await User.findOne({ email });
    if (userExist)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      status: "pending",
      role: "user",
    });

    res.status(201).json({
      message: "Signup request submitted. Waiting for admin approval.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.status,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error registering user" });
  }
};

const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    // Strict validation
    if (!email || !email.trim())
      return res.status(400).json({ message: "Email is required" });

    if (!password || !password.trim())
      return res.status(400).json({ message: "Password is required" });

    email = email.toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "admin" && user.status !== "approved") {
      return res
        .status(403)
        .json({ message: `Account ${user.status}. Contact admin.` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error logging in" });
  }
};

const logoutUser = async (req, res) => {
  res.json({ message: "Logout successful" });
};

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = { getUsers, registeredUser, loginUser, logoutUser };
