const express = require("express");
const auth = require("../middlewares/auth");
const multer = require("../middlewares/multer-config");
const usersController = require("../controllers/users");

const router = express.Router();

// Auth
router.post("/signup", multer, usersController.signup);
router.post("/login", usersController.login);
router.post("/logout", auth, usersController.logout);

// Profil
router.get("/me", auth, usersController.me);

// Boards affiliés
router.get("/boards-member", auth, usersController.getAffiliatedBoards);

/**
 * GET /api/users/search?q=username&page=1&limit=10
 * Recherche paginée d'utilisateurs par username ou email
 * Authentifié uniquement — utilisé pour l'invitation de membres
 */
router.get("/search", auth, usersController.searchUsers);

// Routes individuelles
// router.get("/", auth, usersController.getAllUsers); // désactivé volontairement — utiliser /search
router.get("/:id", auth, usersController.getOneUser);

// Modification / suppression
router.patch("/:id", auth, multer, usersController.modifyUser);
router.delete("/:id", auth, usersController.deleteUser);

module.exports = router;
