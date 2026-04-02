const { sequelize } = require("../models");
const boardRepository = require("../repositories/boards");
const columnRepository = require("../repositories/columns");
const taskRepository = require("../repositories/tasks");
const substaskRepository = require("../repositories/subtasks");
const userBoardRepository = require("../repositories/userBoards");
const { toInt } = require("../utils/parsing");

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
