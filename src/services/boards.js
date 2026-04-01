const { sequelize } = require("../models");
const boardRepository = require("../repositories/boards");
const columnRepository = require("../repositories/columns");
const userBoardRepository = require("../repositories/userBoards");

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
