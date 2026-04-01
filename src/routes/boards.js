const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const loadMembership = require("../middlewares/loadMembership");
const boardController = require("../controllers/boards");

router.post("/", auth, boardController.createBoard);

router.get("/:boardId", auth, loadMembership, boardController.getOneBoard);

router.patch(
  "/:boardId/tasks/:taskId/move",
  auth,
  loadMembership,
  boardController.moveTask,
);

router.delete("/:boardId", auth, loadMembership, boardController.remove);

module.exports = router;
