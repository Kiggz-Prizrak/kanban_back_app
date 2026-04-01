const multer = require("multer");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, "images"),
  filename: (_req, file, callback) => {
    const name = file.originalname.split(" ").join("_");
    const extension = MIME_TYPES[file.mimetype];
    if (!extension) return callback(new Error("Unsupported file type"));
    callback(null, `${name}${Date.now()}.${extension}`);
  },
});

module.exports = multer({ storage }).fields([{ name: "avatar", maxCount: 1 }]);
