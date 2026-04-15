const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const loadMembership = require("../middlewares/loadMembership");
const boardController = require("../controllers/boards");
const requireAdmin = require("../middlewares/requireAdmin");
const requireMember = require("../middlewares/requireMember");

// board
router.post("/", auth, boardController.createBoard);
router.get("/:boardId", auth, loadMembership, boardController.getOneBoard);
router.delete(
  "/:boardId",
  auth,
  loadMembership,
  requireAdmin,
  boardController.remove,
);

// columns — admin only
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

// tasks — admin + member only (viewer locked)
router.post(
  "/:boardId/column/:columnId/new-task",
  auth,
  loadMembership,
  requireMember,
  boardController.addTask,
);
router.put(
  "/:boardId/column/:columnId/task/:taskId",
  auth,
  loadMembership,
  requireMember,
  boardController.updateTask,
);
router.patch(
  "/:boardId/tasks/:taskId/move",
  auth,
  loadMembership,
  requireMember,
  boardController.moveTask,
);
router.delete(
  "/:boardId/column/:columnId/task/:taskId",
  auth,
  loadMembership,
  requireMember,
  boardController.deleteTask,
);

// members — admin only
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
