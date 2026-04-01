const express = require("express");
const auth = require("../middlewares/auth");
const multer = require("../middlewares/multer-config");
const usersController = require("../controllers/users");

const router = express.Router();

router.post("/signup", multer, usersController.signup);
router.post("/login", usersController.login);
router.post("/logout", auth, usersController.logout);

router.get("/me", auth, usersController.me);
// router.get("/", auth, usersController.getAllUsers);
// router.get("/:id", auth, usersController.getOneUser);

router.get("/boards-member", auth, usersController.getAffiliatedBoards);

router.patch("/:id", auth, multer, usersController.modifyUser);
router.delete("/:id", auth, usersController.deleteUser);

module.exports = router;
