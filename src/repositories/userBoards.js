/**
 * @file Repository for board memberships
 */

const { UserBoard, Board, User } = require("../models");

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
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "email", "avatar"],
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

exports.findByIdAndBoardId = async ({ id, boardId }) => {
  return UserBoard.findOne({
    where: { id, boardId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "email", "avatar"],
      },
    ],
  });
};

/**
 * Met à jour un membership par son id
 * @param {number} id
 * @param {{ role?: string }} patch
 */
exports.updateById = async (id, patch) => {
  await UserBoard.update(patch, { where: { id } });

  return UserBoard.findOne({
    where: { id },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "email", "avatar"],
      },
    ],
  });
};

exports.deleteById = async (id) => {
  return UserBoard.destroy({ where: { id } });
};
