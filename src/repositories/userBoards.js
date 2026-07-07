/**
 * @file Repository for board memberships
 */

const { UserBoard, Board, User } = require("../models");

/**
 * @param {object} data
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<UserBoard>}
 */
exports.create = async (data, transaction) => {
  return UserBoard.create(data, { transaction });
};

/**
 * @param {number} id
 * @returns {Promise<UserBoard|null>}
 */
exports.findById = async (id) => {
  return UserBoard.findOne({ where: { id } });
};

/**
 * Liste les memberships d'un utilisateur, avec le board et l'utilisateur associés.
 * @param {number} id
 * @returns {Promise<UserBoard[]>}
 */
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

/**
 * @param {{ userBoardId: number, userId: number }} params
 * @returns {Promise<UserBoard|null>}
 */
exports.findByIdAndUserId = async ({ userBoardId, userId }) => {
  return UserBoard.findOne({
    where: {
      id: userBoardId,
      userId,
    },
  });
};

/**
 * @param {{ userBoardId: number, userId: number, boardId: number }} params
 * @returns {Promise<UserBoard|null>}
 */
exports.findByIdUserIdAndBoardId = async ({ userBoardId, userId, boardId }) => {
  return UserBoard.findOne({
    where: {
      id: userBoardId,
      userId,
      boardId,
    },
  });
};

/**
 * @param {{ userId: number, boardId: number }} params
 * @returns {Promise<UserBoard|null>}
 */
exports.findByUserIdAndBoardId = async ({ userId, boardId }) => {
  return UserBoard.findOne({
    where: {
      userId,
      boardId,
    },
  });
};

/**
 * Charge un membership scopé au board donné (protection IDOR) avec
 * l'utilisateur associé.
 * @param {{ id: number, boardId: number }} params
 * @returns {Promise<UserBoard|null>}
 */
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
 * @returns {Promise<UserBoard|null>} Le membership après mise à jour.
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

/**
 * @param {number} id
 * @returns {Promise<number>} Nombre de lignes supprimées (0 ou 1).
 */
exports.deleteById = async (id) => {
  return UserBoard.destroy({ where: { id } });
};
