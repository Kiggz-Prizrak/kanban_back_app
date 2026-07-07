/**
 * @file Multer middleware for avatar uploads (signup / profile edit).
 * @module middlewares/multer-config
 */

const multer = require("multer");
const crypto = require("crypto");

/** Extensions autorisées, indexées par MIME type déclaré par le client. */
const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
};

/**
 * Stockage disque dans `images/`. Le nom de fichier est généré côté
 * serveur (`crypto.randomUUID()`) — le nom d'origine envoyé par le client
 * n'est jamais utilisé pour construire le chemin, afin d'éviter tout path
 * traversal via un `filename` malveillant.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, "images"),
  filename: (_req, file, callback) => {
    const extension = MIME_TYPES[file.mimetype];
    if (!extension) return callback(new Error("Unsupported file type"));
    callback(null, `${crypto.randomUUID()}.${extension}`);
  },
});

/**
 * Middleware Express prêt à l'emploi : accepte un unique champ `avatar`,
 * limité à 5 Mo, dans un body `multipart/form-data`.
 * @type {import('express').RequestHandler}
 */
module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([{ name: "avatar", maxCount: 1 }]);
