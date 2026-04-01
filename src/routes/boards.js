const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const loadMembership = require("../middlewares/loadMembership");
const boardController = require("../controllers/boards");
const requireAdmin = require("../middlewares/requireAdmin");

// board
router.post("/", auth, boardController.createBoard);
router.get("/:boardId", auth, loadMembership, boardController.getOneBoard);
router.delete("/:boardId", auth, loadMembership, boardController.remove);

// columns
router.post(
  "/:boardId/new-column",
  auth,
  loadMembership,
  requireAdmin,
  boardController.addColumn,
);
router.put(
  "/:boardId/column/:columnId",
  auth,
  loadMembership,
  requireAdmin,
  boardController.updateColumn,
);
router.delete(
  "/:boardId/column/:columnId",
  auth,
  loadMembership,
  requireAdmin,
  boardController.deleteColumn,
);

// task
router.post(
  "/:boardId/column/:columnId/new-task",
  auth,
  loadMembership,
  boardController.addTask,
);
router.put(
  "/:boardId/column/:columnId/task/:taskId",
  auth,
  loadMembership,
  boardController.updateTask,
);
router.patch(
  "/:boardId/tasks/:taskId/move",
  auth,
  loadMembership,
  boardController.moveTask,
);
router.delete(
  "/:boardId/column/:columnId/task/:taskId",
  auth,
  loadMembership,
  boardController.deleteTask,
);

//member
router.post(
  "/:boardId/new-member",
  auth,
  loadMembership,
  requireAdmin,
  boardController.addMember,
);
router.put(
  "/:boardId/member/:memberId",
  auth,
  loadMembership,
  requireAdmin,
  boardController.updateMember,
);
router.delete(
  "/:boardId/member/:memberId",
  auth,
  loadMembership,
  requireAdmin,
  boardController.deleteMember,
);

module.exports = router;
