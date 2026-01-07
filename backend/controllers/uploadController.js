const cloudinary = require("../config/cloudinary");
const multer = require("multer");

// multer memory storage (no need to save locally)
const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.uploadImage = [
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // upload to Cloudinary
      const result = await cloudinary.uploader.upload_stream(
        { folder: "blog-posts" },
        (error, result) => {
          if (error) {
            console.error(error);
            return res
              .status(500)
              .json({ message: "Cloudinary upload failed" });
          }
          res.status(200).json({ url: result.secure_url });
        }
      );

      result.end(req.file.buffer); // send the file buffer to Cloudinary
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    }
  },
];
