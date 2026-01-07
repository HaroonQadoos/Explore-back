const cloudinary = require("../config/cloudinary");
const multer = require("multer");

// multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.uploadImage = [
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Wrap upload_stream in a Promise to use async/await
      const uploadToCloudinary = (fileBuffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "blog-posts" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(fileBuffer);
        });

      const result = await uploadToCloudinary(req.file.buffer);

      res.status(200).json({ url: result.secure_url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    }
  },
];
