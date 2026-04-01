const taskService = require("../services/tasks");

exports.createBoard = async (req, res) => {
  console.log(req);
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
