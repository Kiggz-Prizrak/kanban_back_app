const multer = require("multer");
const crypto = require("crypto");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, "images"),
  filename: (_req, file, callback) => {
    const extension = MIME_TYPES[file.mimetype];
    if (!extension) return callback(new Error("Unsupported file type"));
    callback(null, `${crypto.randomUUID()}.${extension}`);
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([{ name: "avatar", maxCount: 1 }]);
