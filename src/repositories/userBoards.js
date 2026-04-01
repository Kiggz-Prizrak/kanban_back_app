/**
 * @file Repository for board memberships
 */

const { UserBoard, Board } = require("../models");

exports.create = async (data, transaction) => {
  return UserBoard.create(data, { transaction });
};

exports.findById = async (id) => {
  return UserBoard.findOne({ where: { id } });
};
exports.findAllByUserId = async (id) => {
  return UserBoard.findAll({
    where: { userId: id },
    include: [
      {
        model: Board,
        as: "board",
        attributes: ["id", "name"],
      },
    ],
  });
};

exports.findByIdAndUserId = async ({ userBoardId, userId }) => {
  return UserBoard.findOne({
    where: {
      id: userBoardId,
      userId,
    },
  });
};

exports.findByIdUserIdAndBoardId = async ({ userBoardId, userId, boardId }) => {
  return UserBoard.findOne({
    where: {
      id: userBoardId,
      userId,
      boardId,
    },
  });
};

exports.findByUserIdAndBoardId = async ({ userId, boardId }) => {
  return UserBoard.findOne({
    where: {
      userId,
      boardId,
    },
  });
};
