/**
 * @file Repository for board memberships
 */

const { UserBoard } = require("../models");

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
