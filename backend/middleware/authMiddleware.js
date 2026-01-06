const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const protect = async (req, res, next) => {
  let token = req.headers.authorization;

  //  Get token from Authorization header
  if (token && token.startsWith("Bearer")) {
    token = token.split(" ")[1];
  }
  // OR get token from cookies
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (req.user.isBlocked) {
      return res.status(403).json({ message: "User is blocked" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token", err });
  }
};

module.exports = { protect };
