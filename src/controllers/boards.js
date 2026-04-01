const taskService = require("../services/tasks");
const boardService = require("../services/boards");
const REGEX = require("../utils/regex");

exports.createBoard = async (req, res) => {
  try {
    if (!REGEX.title.test(req.body.title)) {
      throw httpError(400, "invalid title");
    }

    if (
      Array.isArray(req.body.columns) &&
      req.body.columns.length > 0 &&
      !req.body.columns.every((value) => REGEX.title.test(value))
    ) {
      throw httpError(400, "invalid columns");
    }

    const created = await boardService.createBoard({
      userId: req.auth.id,
      title: req.body.title,
      columns: req.body.columns || [],
    });

    return res.status(201).json({
      message: "board created",
      board: created,
    });
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "An error occurred",
    });
  }
};
exports.getOneBoard = async (req, res) => {
  console.log(req);
};

exports.remove = async (req, res) => {
  console.log(req);
};

exports.moveTask = async (req, res) => {
  try {
    if (!["admin", "member"].includes(req.membership.role)) {
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
