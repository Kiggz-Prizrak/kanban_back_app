/**
 * @file Data access layer for the User model.
 * @module repositories/users
 */

const { User } = require("../models");
const { Op } = require("sequelize");

/**
 * @param {number} id
 * @returns {Promise<User|null>} L'utilisateur (sans le mot de passe) ou null.
 */
exports.findById = async (id) => {
  return User.findOne({
    where: { id },
    attributes: ["id", "username", "email", "avatar"],
  });
};

/**
 * @param {string} email
 * @returns {Promise<User|null>} L'utilisateur complet (avec le hash du mot
 * de passe — usage interne à l'auth), ou null.
 */
exports.findByEmail = async (email) => {
  return User.findOne({ where: { email } });
};

/**
 * @param {string} username
 * @returns {Promise<User|null>}
 */
exports.findByUsername = async (username) => {
  return User.findOne({ where: { username } });
};

/**
 * @param {object} data
 * @returns {Promise<User>}
 */
exports.create = async (data) => {
  return User.create(data);
};

/**
 * @param {number} id
 * @param {object} patch
 * @returns {Promise<[number]>} Résultat Sequelize `Model.update` (nombre de lignes affectées).
 */
exports.updateById = async (id, patch) => {
  return User.update(patch, { where: { id } });
};

/**
 * @param {number} id
 * @returns {Promise<number>} Nombre de lignes supprimées (0 ou 1).
 */
exports.deleteById = async (id) => {
  return User.destroy({ where: { id } });
};

/**
 * Recherche paginée d'utilisateurs par username ou email.
 * @param {{ q: string, page: number, limit: number, excludeId: number }} params
 * @returns {Promise<{ users: User[], total: number, page: number, totalPages: number }>}
 */
exports.searchByUsername = async ({ q, page = 1, limit = 10, excludeId }) => {
  const offset = (page - 1) * limit;

  const where = {
    id: { [Op.ne]: excludeId },
  };

  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    where[Op.or] = [
      { username: { [Op.like]: term } },
      { email: { [Op.like]: term } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: ["id", "username", "email", "avatar"],
    order: [["username", "ASC"]],
    limit,
    offset,
  });

  return {
    users: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
};
