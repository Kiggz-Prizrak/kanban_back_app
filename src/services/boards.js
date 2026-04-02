const { sequelize } = require("../models");
const boardRepository = require("../repositories/boards");
const columnRepository = require("../repositories/columns");
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
