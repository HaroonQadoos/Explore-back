const multer = require("multer");

// Memory storage (no disk, perfect for Vercel)
const storage = multer.memoryStorage();

// Only accept image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

module.exports = multer({ storage, fileFilter });
