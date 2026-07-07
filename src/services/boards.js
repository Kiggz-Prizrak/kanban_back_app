/**
 * @file Business logic for boards, columns, tasks and subtasks.
 * @module services/boards
 */

const { sequelize } = require("../models");
const boardRepository = require("../repositories/boards");
const columnRepository = require("../repositories/columns");
const taskRepository = require("../repositories/tasks");
const substaskRepository = require("../repositories/subtasks");
const userBoardRepository = require("../repositories/userBoards");
const { toInt } = require("../utils/parsing");

/**
 * Crée un board (+ colonnes initiales) et rend son créateur admin, dans
 * une transaction.
 * @param {{ userId: number, title: string, columns?: string[] }} params
 * @returns {Promise<import('../models').Board>} Le board créé, rechargé avec ses relations.
 * @throws {Error} 500 en cas d'échec de création.
 */
exports.createBoard = async ({ userId, title, columns }) => {
  try {
    const safeColumns = Array.isArray(columns) ? columns : [];

    return await sequelize.transaction(async (transaction) => {
      const board = await boardRepository.create(
        {
          name: title.trim(),
          createdByUserId: userId,
        },
        transaction,
      );

      if (safeColumns.length > 0) {
        const normalizedColumns = safeColumns.map((value, index) => ({
          boardId: board.id,
          name: String(value).trim(),
          position: index,
        }));

        await columnRepository.bulkCreate(normalizedColumns, transaction);
      }

      await userBoardRepository.create(
        {
          userId,
          boardId: board.id,
          role: "admin",
        },
        transaction,
      );

      return boardRepository.findById(board.id, transaction);
    });
  } catch (error) {
    if (error.statusCode || error.status) {
      throw error;
    }

    const err = new Error("Error creating board");
    err.statusCode = 500;
    throw err;
  }
};

/**
 * @param {{ boardId: number|string }} params
 * @returns {Promise<import('../models').Board>}
 * @throws {Error} 400 si l'id est invalide.
 * @throws {Error} 404 si le board n'existe pas.
 */
exports.getOneBoard = async ({ boardId }) => {
  const id = toInt(boardId);

  if (!id) {
    const err = new Error("Invalid board id");
    err.statusCode = 400;
    throw err;
  }

  const board = await boardRepository.findById(id);

  if (!board) {
    const err = new Error("Board not found");
    err.statusCode = 404;
    throw err;
  }

  return board;
};

/**
 * Supprime un board. Réservé au créateur du board (en plus du contrôle
 * "admin membership" déjà fait côté controller/route).
 * @param {{ boardId: number|string, userId: number }} params
 * @returns {Promise<{ message: string, boardId: number }>}
 * @throws {Error} 400 si l'id est invalide.
 * @throws {Error} 403 si l'appelant n'est pas le créateur du board.
 * @throws {Error} 404 si le board n'existe pas.
 */
exports.removeBoard = async ({ boardId, userId }) => {
  const id = toInt(boardId);

  if (!id) {
    const err = new Error("Invalid board id");
    err.statusCode = 400;
    throw err;
  }

  const board = await boardRepository.findById(id);

  if (!board) {
    const err = new Error("Board not found");
    err.statusCode = 404;
    throw err;
  }

  if (Number(board.createdByUserId) !== Number(userId)) {
    const err = new Error("Only the creator can delete this board");
    err.statusCode = 403;
    throw err;
  }

  await boardRepository.deleteById(id);

  return {
    message: "Board deleted successfully",
    boardId: id,
  };
};

/**
 * Ajoute une colonne en fin de board.
 * @param {{ boardId: number|string, name: string }} params
 * @returns {Promise<{ message: string, column: import('../models').Column }>}
 * @throws {Error} 400 si l'id est invalide.
 * @throws {Error} 404 si le board n'existe pas.
 */
exports.addColumn = async ({ boardId, name }) => {
  const parsedBoardId = toInt(boardId);

  if (!parsedBoardId) {
    const err = new Error("Invalid board id");
    err.statusCode = 400;
    throw err;
  }

  const board = await boardRepository.findById(parsedBoardId);

  if (!board) {
    const err = new Error("Board not found");
    err.statusCode = 404;
    throw err;
  }

  const nextPosition = Array.isArray(board.columns) ? board.columns.length : 0;

  const column = await columnRepository.create({
    boardId: parsedBoardId,
    name,
    position: nextPosition,
  });

  return {
    message: "Column created successfully",
    column,
  };
};

/**
 * Renomme et/ou repositionne une colonne, scopée au board donné.
 * @param {{ boardId: number|string, columnId: number|string, name?: string, position?: number }} params
 * @returns {Promise<{ message: string, column: import('../models').Column }>}
 * @throws {Error} 400 si `boardId`/`columnId` sont invalides.
 * @throws {Error} 404 si la colonne n'existe pas dans ce board.
 */
exports.updateColumn = async ({ boardId, columnId, name, position }) => {
  const parsedBoardId = toInt(boardId);
  const parsedColumnId = toInt(columnId);

  if (!parsedBoardId || !parsedColumnId) {
    const err = new Error("Invalid board id or column id");
    err.statusCode = 400;
    throw err;
  }

  const column = await columnRepository.findByIdInBoard({
    boardId: parsedBoardId,
    columnId: parsedColumnId,
  });

  if (!column) {
    const err = new Error("Column not found");
    err.statusCode = 404;
    throw err;
  }

  const patch = {};

  if (name !== undefined) {
    patch.name = name;
  }

  if (position !== undefined) {
    patch.position = Number(position);
  }

  await columnRepository.updateById(parsedColumnId, patch);

  const updatedColumn = await columnRepository.findByIdInBoard({
    boardId: parsedBoardId,
    columnId: parsedColumnId,
  });

  return {
    message: "Column updated successfully",
    column: updatedColumn,
  };
};

/**
 * Supprime une colonne, scopée au board donné. Les tâches associées sont
 * supprimées en cascade côté DB.
 * @param {{ boardId: number|string, columnId: number|string }} params
 * @returns {Promise<{ message: string, columnId: number }>}
 * @throws {Error} 400 si `boardId`/`columnId` sont invalides.
 * @throws {Error} 404 si la colonne n'existe pas dans ce board.
 */
exports.deleteColumn = async ({ boardId, columnId }) => {
  const parsedBoardId = toInt(boardId);
  const parsedColumnId = toInt(columnId);

  if (!parsedBoardId || !parsedColumnId) {
    const err = new Error("Invalid board id or column id");
    err.statusCode = 400;
    throw err;
  }

  const column = await columnRepository.findByIdInBoard({
    boardId: parsedBoardId,
    columnId: parsedColumnId,
  });

  if (!column) {
    const err = new Error("Column not found");
    err.statusCode = 404;
    throw err;
  }

  await columnRepository.deleteById(parsedColumnId);

  return {
    message: "Column deleted successfully",
    columnId: parsedColumnId,
  };
};

/**
 * Crée une tâche en fin de colonne (+ sous-tâches initiales), dans une
 * transaction.
 * @param {{ boardId: number|string, columnId: number|string, userId: number, title: string, description: string, subtasks?: (string|{title:string})[] }} params
 * @returns {Promise<{ message: string, task: import('../models').Task }>}
 * @throws {Error} 400 si `boardId`/`columnId` sont invalides.
 * @throws {Error} 404 si la colonne n'existe pas dans ce board.
 */
exports.addTask = async ({
  boardId,
  columnId,
  userId,
  title,
  description,
  subtasks = [],
}) => {
  const parsedBoardId = toInt(boardId);
  const parsedColumnId = toInt(columnId);

  if (!parsedBoardId || !parsedColumnId) {
    const err = new Error("Invalid board id or column id");
    err.statusCode = 400;
    throw err;
  }

  return sequelize.transaction(async (transaction) => {
    const column = await columnRepository.findByIdInBoard({
      boardId: parsedBoardId,
      columnId: parsedColumnId,
      transaction,
    });

    if (!column) {
      const err = new Error("Column not found");
      err.statusCode = 404;
      throw err;
    }

    const count = await taskRepository.countByColumnId({
      columnId: parsedColumnId,
      transaction,
    });

    const task = await taskRepository.create(
      {
        title,
        description,
        createdByUserId: userId,
        columnId: parsedColumnId,
        position: count,
      },
      transaction,
    );

    const safeSubtasks = Array.isArray(subtasks)
      ? subtasks
          .map((value) =>
            typeof value === "string"
              ? { title: value.trim() }
              : { title: String(value?.title || "").trim() },
          )
          .filter((item) => item.title)
      : [];

    if (safeSubtasks.length > 0) {
      await substaskRepository.bulkCreate(
        safeSubtasks.map((item) => ({
          title: item.title,
          taskId: task.id,
          isCompleted: false,
        })),
        transaction,
      );
    }

    const createdTask = await taskRepository.findByIdInBoard({
      boardId: parsedBoardId,
      taskId: task.id,
      transaction,
    });

    return {
      message: "Task created successfully",
      task: createdTask,
    };
  });
};

/**
 * Met à jour une tâche (titre/description) et, si `subtasks` est fourni,
 * resynchronise ses sous-tâches par diff (update les existantes listées,
 * crée les nouvelles, supprime celles absentes de la liste), dans une
 * transaction.
 * @param {{ boardId: number|string, columnId: number|string, taskId: number|string, title?: string, description?: string, subtasks?: {id?: number, title?: string, isCompleted?: boolean}[] }} params
 * @returns {Promise<{ message: string, task: import('../models').Task }>}
 * @throws {Error} 400 si `boardId`/`columnId`/`taskId` sont invalides.
 * @throws {Error} 404 si la tâche n'existe pas dans cette colonne/board.
 */
exports.updateTask = async ({
  boardId,
  columnId,
  taskId,
  title,
  description,
  subtasks,
}) => {
  const parsedBoardId = toInt(boardId);
  const parsedColumnId = toInt(columnId);
  const parsedTaskId = toInt(taskId);

  if (!parsedBoardId || !parsedColumnId || !parsedTaskId) {
    const err = new Error("Invalid board id, column id or task id");
    err.statusCode = 400;
    throw err;
  }

  return sequelize.transaction(async (transaction) => {
    const task = await taskRepository.findByIdInBoard({
      boardId: parsedBoardId,
      taskId: parsedTaskId,
      transaction,
    });

    if (!task || Number(task.columnId) !== parsedColumnId) {
      const err = new Error("Task not found");
      err.statusCode = 404;
      throw err;
    }

    const patch = {};

    if (title !== undefined) {
      patch.title = title;
    }

    if (description !== undefined) {
      patch.description = description;
    }

    if (Object.keys(patch).length > 0) {
      await taskRepository.updateById(parsedTaskId, patch, transaction);
    }

    if (Array.isArray(subtasks)) {
      const existingSubtasks = await substaskRepository.findAllByTaskId({
        taskId: parsedTaskId,
        transaction,
      });

      const existingById = new Map(
        existingSubtasks.map((item) => [Number(item.id), item]),
      );

      const incomingIds = new Set();

      for (const subtask of subtasks) {
        const subtaskId = subtask?.id ? Number(subtask.id) : null;
        const subtaskTitle = String(subtask?.title || "").trim();
        const isCompleted = Boolean(subtask?.isCompleted);

        if (subtaskId && existingById.has(subtaskId)) {
          incomingIds.add(subtaskId);
          await substaskRepository.updateById(
            subtaskId,
            {
              title: subtaskTitle,
              isCompleted,
            },
            transaction,
          );
        } else if (subtaskTitle) {
          await substaskRepository.create(
            {
              taskId: parsedTaskId,
              title: subtaskTitle,
              isCompleted,
            },
            transaction,
          );
        }
      }

      for (const existing of existingSubtasks) {
        if (!incomingIds.has(Number(existing.id))) {
          await substaskRepository.deleteById(existing.id, transaction);
        }
      }
    }

    const updatedTask = await taskRepository.findByIdInBoard({
      boardId: parsedBoardId,
      taskId: parsedTaskId,
      transaction,
    });

    return {
      message: "Task updated successfully",
      task: updatedTask,
    };
  });
};

/**
 * Supprime une tâche, scopée à la colonne/board donnés.
 * @param {{ boardId: number|string, columnId: number|string, taskId: number|string }} params
 * @returns {Promise<{ message: string, taskId: number }>}
 * @throws {Error} 400 si `boardId`/`columnId`/`taskId` sont invalides.
 * @throws {Error} 404 si la tâche n'existe pas dans cette colonne/board.
 */
exports.deleteTask = async ({ boardId, columnId, taskId }) => {
  const parsedBoardId = toInt(boardId);
  const parsedColumnId = toInt(columnId);
  const parsedTaskId = toInt(taskId);

  if (!parsedBoardId || !parsedColumnId || !parsedTaskId) {
    const err = new Error("Invalid board id, column id or task id");
    err.statusCode = 400;
    throw err;
  }

  const task = await taskRepository.findByIdInBoard({
    boardId: parsedBoardId,
    taskId: parsedTaskId,
  });

  if (!task || Number(task.columnId) !== parsedColumnId) {
    const err = new Error("Task not found");
    err.statusCode = 404;
    throw err;
  }

  await taskRepository.deleteById(parsedTaskId);

  return {
    message: "Task deleted successfully",
    taskId: parsedTaskId,
  };
};
