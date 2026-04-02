const { sequelize, Column, Task, Substask, User } = require("../models");

async function getColumnInBoard({ boardId, columnId, transaction }) {
  return Column.findOne({
    where: {
      id: columnId,
      boardId,
    },
    transaction,
  });
}

exports.create = async (data, transaction = null) => {
  return Task.create(data, { transaction });
};

exports.countByColumnId = async ({ columnId, transaction = null }) => {
  return Task.count({
    where: { columnId },
    transaction,
  });
};

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

exports.deleteById = async (id, transaction = null) => {
  return Task.destroy({
    where: { id },
    transaction,
  });
};

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
