const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const app = express();
dotenv.config();

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.DB);
    isConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.error(" MongoDB connection error:", error);
    process.exit(1);
  }
};
connectDB();
app.use(
  cors({
    origin: [
      "https://explore-front-aznp.vercel.app",
      "https://explore-dash-a3tm.vercel.app",
    ], // frontend origin
    credentials: true, // allow cookies
  })
);
// app.use((req, res, next) => {
//   if (!isConnected) {
//     connectDB();
//   }
//   next();
// });
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// API Routes

app.use("/api/upload", uploadRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;
