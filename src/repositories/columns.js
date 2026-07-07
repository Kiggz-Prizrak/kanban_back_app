/**
 * @file Data access layer for the Column model.
 * @module repositories/columns
 */

const { Column } = require("../models");

/**
 * @param {object[]} data
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Column[]>}
 */
exports.bulkCreate = async (data, transaction) => {
  return Column.bulkCreate(data, { transaction });
};

/**
 * @param {object} data
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Column>}
 */
exports.create = async (data, transaction = null) => {
  return Column.create(data, { transaction });
};

/**
 * Charge une colonne en la scopant au board donné — retourne null si la
 * colonne existe mais n'appartient pas à ce board (protection IDOR).
 * @param {{ boardId: number, columnId: number, transaction?: import('sequelize').Transaction }} params
 * @returns {Promise<Column|null>}
 */
exports.findByIdInBoard = async ({ boardId, columnId, transaction = null }) => {
  return Column.findOne({
    where: {
      id: columnId,
      boardId,
    },
    transaction,
  });
};

/**
 * @param {number} id
 * @param {object} patch
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Column|null>} La colonne après mise à jour.
 */
exports.updateById = async (id, patch, transaction = null) => {
  await Column.update(patch, {
    where: { id },
    transaction,
  });

  return Column.findOne({
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
  return Column.destroy({
    where: { id },
    transaction,
  });
};
