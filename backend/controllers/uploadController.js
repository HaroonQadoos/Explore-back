const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const streamifier = require("streamifier");

const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.uploadImage = [
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const uploadToCloudinary = (fileBuffer) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "blog-posts" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.createReadStream(fileBuffer).pipe(stream);
        });

      const result = await uploadToCloudinary(req.file.buffer);
      res.status(200).json({ url: result.secure_url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    }
  },
];
