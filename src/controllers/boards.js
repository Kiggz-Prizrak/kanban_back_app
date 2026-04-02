const taskService = require("../services/tasks");
const boardService = require("../services/boards");
const REGEX = require("../utils/regex");
const { httpError } = require("../utils/httpError");

exports.createBoard = async (req, res) => {
  try {
    const title =
      typeof req.body.title === "string" ? req.body.title.trim() : "";
    const columns = Array.isArray(req.body.columns) ? req.body.columns : [];

    if (!REGEX.title.test(title)) {
      throw httpError(400, "invalid title");
    }

    if (
      columns.length > 0 &&
      !columns.every(
        (value) => typeof value === "string" && REGEX.title.test(value.trim()),
      )
    ) {
      throw httpError(400, "invalid columns");
    }

    const created = await boardService.createBoard({
      userId: req.auth.id,
      title,
      columns,
    });

    return res.status(201).json({
      message: "board created",
      board: created,
      boardId: created.id,
    });
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "An error occurred",
    });
  }
};

exports.getOneBoard = async (req, res) => {
  try {
    const board = await boardService.getOneBoard({
      boardId: req.params.boardId,
    });

    return res.status(200).json(board);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "Error",
    });
  }
};

exports.remove = async (req, res) => {
  try {
    if (!req.membership) {
      const error = new Error("Membership not found");
      error.statusCode = 403;
      throw error;
    }

    if (req.membership.role !== "admin") {
      const error = new Error("Admin role required");
      error.statusCode = 403;
      throw error;
    }

    const result = await boardService.removeBoard({
      boardId: req.params.boardId,
      userId: req.auth.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "An error occurred",
    });
  }
};

exports.addColumn = async (req, res) => {
  console.log(req);
};

exports.updateColumn = async (req, res) => {
  console.log(req);
};

exports.deleteColumn = async (req, res) => {
  console.log(req);
};

exports.addTask = async (req, res) => {
  console.log(req);
};

exports.updateTask = async (req, res) => {
  console.log(req);
};

exports.moveTask = async (req, res) => {
  try {
    if (!req.membership || !["admin", "member"].includes(req.membership.role)) {
      const error = new Error("Insufficient permissions");
      error.status = 403;
      throw error;
    }

    const result = await taskService.moveTask({
      boardId: req.params.boardId,
      taskId: req.params.taskId,
      sourceColumnId: req.body.sourceColumnId,
      destinationColumnId: req.body.destinationColumnId,
      destinationIndex: req.body.destinationIndex,
    });

    return res.status(200).json(result);
  } catch (err) {
    const status = err.status || err.statusCode || 500;

    return res.status(status).json({
      message: err.message || "Error",
    });
  }
};

exports.deleteTask = async (req, res) => {
  console.log(req);
};

exports.addMember = async (req, res) => {
  console.log(req);
};

exports.updateMember = async (req, res) => {
  console.log(req);
};

exports.deleteMember = async (req, res) => {
  console.log(req);
};
