/**
 * @file Data access layer for the Substask (subtask) model.
 * @module repositories/subtasks
 */

const { Substask } = require("../models");

/**
 * @param {object} data
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Substask>}
 */
exports.create = async (data, transaction = null) => {
  return Substask.create(data, { transaction });
};

/**
 * @param {object[]} data
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Substask[]>}
 */
exports.bulkCreate = async (data, transaction = null) => {
  return Substask.bulkCreate(data, { transaction });
};

/**
 * @param {{ taskId: number, transaction?: import('sequelize').Transaction }} params
 * @returns {Promise<Substask[]>} Sous-tâches triées par id croissant.
 */
exports.findAllByTaskId = async ({ taskId, transaction = null }) => {
  return Substask.findAll({
    where: { taskId },
    order: [["id", "ASC"]],
    transaction,
  });
};

/**
 * @param {number} id
 * @param {object} patch
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<Substask|null>} La sous-tâche après mise à jour.
 */
exports.updateById = async (id, patch, transaction = null) => {
  await Substask.update(patch, {
    where: { id },
    transaction,
  });

  return Substask.findOne({
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
  return Substask.destroy({
    where: { id },
    transaction,
  });
};
