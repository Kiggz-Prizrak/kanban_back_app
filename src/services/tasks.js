/**
 * @file Business logic for moving/reordering tasks between columns.
 * @module services/tasks
 */

const taskRepository = require("../repositories/tasks.js");

/**
 * Valide les paramètres de déplacement puis délègue au repository, qui
 * fait la vérification d'appartenance au board et réécrit les positions
 * dans une transaction.
 * @param {{ boardId: number|string, taskId: number|string, sourceColumnId: number|string, destinationColumnId: number|string, destinationIndex: number|string }} params
 * @returns {Promise<{ message: string }>}
 * @throws {Error} 400 si `sourceColumnId`/`destinationColumnId`/`destinationIndex` sont manquants ou invalides.
 */
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
