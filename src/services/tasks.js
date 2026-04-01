const taskRepository = require("../repositories/tasks.js");

exports.moveTask = async ({
  boardId,
  taskId,
  sourceColumnId,
  destinationColumnId,
  destinationIndex,
}) => {
  if (!sourceColumnId || !destinationColumnId) {
    const error = new Error(
      "sourceColumnId and destinationColumnId are required",
    );
    error.status = 400;
    throw error;
  }

  if (
    destinationIndex === undefined ||
    destinationIndex === null ||
    Number.isNaN(Number(destinationIndex))
  ) {
    const error = new Error("destinationIndex is required");
    error.status = 400;
    throw error;
  }

  return taskRepository.moveTask({
    boardId: Number(boardId),
    taskId: Number(taskId),
    sourceColumnId: Number(sourceColumnId),
    destinationColumnId: Number(destinationColumnId),
    destinationIndex: Number(destinationIndex),
  });
};
