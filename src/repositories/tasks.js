/**
 * @file Data access layer for the Task model, including the cross-column
 * move/reorder logic.
 * @module repositories/tasks
 */

const { sequelize, Column, Task, Substask, User } = require("../models");

/**
 * Charge une colonne scopée au board donné (protection IDOR).
 * @param {{ boardId: number, columnId: number, transaction?: import('sequelize').Transaction }} params
 * @returns {Promise<Column|null>}
 * @private
 */
async function getColumnInBoard({ boardId, columnId, transaction }) {
  return Column.findOne({
    where: {
      id: columnId,
      boardId,
    },
    transaction,
  });
}

/**
 * @param {object} data
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Task>}
 */
exports.create = async (data, transaction = null) => {
  return Task.create(data, { transaction });
};

/**
 * @param {{ columnId: number, transaction?: import('sequelize').Transaction }} params
 * @returns {Promise<number>}
 */
exports.countByColumnId = async ({ columnId, transaction = null }) => {
  return Task.count({
    where: { columnId },
    transaction,
  });
};

/**
 * Charge une tâche avec sa colonne (scopée au board — protection IDOR),
 * son créateur et ses sous-tâches.
 * @param {{ boardId: number, taskId: number, transaction?: import('sequelize').Transaction }} params
 * @returns {Promise<Task|null>}
 */
exports.findByIdInBoard = async ({ boardId, taskId, transaction = null }) => {
  return Task.findOne({
    include: [
      {
        model: Column,
        as: "column",
        where: { boardId },
        attributes: ["id", "boardId"],
      },
      {
        model: User,
        as: "creator",
        attributes: ["id", "username", "email"],
      },
      {
        model: Substask,
        as: "substasks",
        attributes: ["id", "title", "isCompleted", "taskId"],
      },
    ],
    where: { id: taskId },
    transaction,
  });
};

/**
 * @param {number} id
 * @param {object} patch
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Task|null>} La tâche après mise à jour.
 */
exports.updateById = async (id, patch, transaction = null) => {
  await Task.update(patch, {
    where: { id },
    transaction,
  });

  return Task.findOne({
    where: { id },
    transaction,
  });
};

/**
 * @param {number} id
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<number>} Nombre de lignes supprimées (0 ou 1).
 */
exports.deleteById = async (id, transaction = null) => {
  return Task.destroy({
    where: { id },
    transaction,
  });
};

/**
 * Charge une tâche avec sa colonne, scopée au board (protection IDOR),
 * sans les relations creator/substasks (utilisé par `moveTask`).
 * @param {{ boardId: number, taskId: number, transaction?: import('sequelize').Transaction }} params
 * @returns {Promise<Task|null>}
 * @private
 */
async function getTaskInBoard({ boardId, taskId, transaction }) {
  return Task.findOne({
    include: [
      {
        model: Column,
        as: "column",
        where: {
          boardId,
        },
        attributes: ["id", "boardId"],
      },
    ],
    where: {
      id: taskId,
    },
    transaction,
  });
}

/**
 * @param {{ columnId: number, transaction?: import('sequelize').Transaction }} params
 * @returns {Promise<Task[]>} Tâches de la colonne, triées par position puis id.
 * @private
 */
async function getTasksByColumnId({ columnId, transaction }) {
  return Task.findAll({
    where: { columnId },
    order: [
      ["position", "ASC"],
      ["id", "ASC"],
    ],
    transaction,
  });
}

/**
 * Réécrit séquentiellement le champ `position` de chaque tâche selon son
 * index dans le tableau fourni.
 * @param {Task[]} tasks Tâches déjà dans l'ordre final souhaité.
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<void>}
 * @private
 */
async function rewritePositions(tasks, transaction) {
  for (let index = 0; index < tasks.length; index += 1) {
    await tasks[index].update(
      {
        position: index,
      },
      { transaction },
    );
  }
}

/**
 * Déplace une tâche vers une autre colonne (ou la réordonne au sein de la
 * même colonne) et réécrit les positions de toutes les tâches impactées
 * dans une transaction. Vérifie que la colonne source, la colonne
 * destination et la tâche appartiennent bien au board donné, et que la
 * tâche appartient bien à la colonne source déclarée.
 * @param {{ boardId: number, taskId: number, sourceColumnId: number, destinationColumnId: number, destinationIndex: number }} params
 * @returns {Promise<{ message: string }>}
 * @throws {Error} 404 si colonne(s) ou tâche introuvable(s) dans ce board.
 * @throws {Error} 400 si la tâche n'appartient pas à `sourceColumnId`.
 */
exports.moveTask = async ({
  boardId,
  taskId,
  sourceColumnId,
  destinationColumnId,
  destinationIndex,
}) => {
  return sequelize.transaction(async (transaction) => {
    const sourceColumn = await getColumnInBoard({
      boardId,
      columnId: sourceColumnId,
      transaction,
    });

    const destinationColumn = await getColumnInBoard({
      boardId,
      columnId: destinationColumnId,
      transaction,
    });

    if (!sourceColumn || !destinationColumn) {
      const error = new Error("Column not found in this board");
      error.status = 404;
      throw error;
    }

    const task = await getTaskInBoard({
      boardId,
      taskId,
      transaction,
    });

    if (!task) {
      const error = new Error("Task not found in this board");
      error.status = 404;
      throw error;
    }

    if (Number(task.columnId) !== Number(sourceColumnId)) {
      const error = new Error("Task does not belong to source column");
      error.status = 400;
      throw error;
    }

    if (sourceColumnId === destinationColumnId) {
      const tasks = await getTasksByColumnId({
        columnId: sourceColumnId,
        transaction,
      });

      const reordered = tasks.filter(
        (item) => Number(item.id) !== Number(taskId),
      );

      const safeIndex = Math.max(
        0,
        Math.min(destinationIndex, reordered.length),
      );
      reordered.splice(safeIndex, 0, task);

      await rewritePositions(reordered, transaction);

      return {
        message: "Task moved successfully",
      };
    }

    const sourceTasks = await getTasksByColumnId({
      columnId: sourceColumnId,
      transaction,
    });

    const destinationTasks = await getTasksByColumnId({
      columnId: destinationColumnId,
      transaction,
    });

    const nextSourceTasks = sourceTasks.filter(
      (item) => Number(item.id) !== Number(taskId),
    );

    const nextDestinationTasks = destinationTasks.filter(
      (item) => Number(item.id) !== Number(taskId),
    );

    const safeIndex = Math.max(
      0,
      Math.min(destinationIndex, nextDestinationTasks.length),
    );

    nextDestinationTasks.splice(safeIndex, 0, task);

    await rewritePositions(nextSourceTasks, transaction);

    for (let index = 0; index < nextDestinationTasks.length; index += 1) {
      await nextDestinationTasks[index].update(
        {
          columnId: destinationColumnId,
          position: index,
        },
        { transaction },
      );
    }

    return {
      message: "Task moved successfully",
    };
  });
};
