const { User } = require("../models");
const { Op } = require("sequelize");

exports.findById = async (id) => {
  return User.findOne({
    where: { id },
    attributes: ["id", "username", "email", "avatar"],
  });
};

exports.findByEmail = async (email) => {
  return User.findOne({ where: { email } });
};

exports.findByUsername = async (username) => {
  return User.findOne({ where: { username } });
};

exports.create = async (data) => {
  return User.create(data);
};

exports.updateById = async (id, patch) => {
  return User.update(patch, { where: { id } });
};

exports.deleteById = async (id) => {
  return User.destroy({ where: { id } });
};

/**
 * @param {{ q: string, page: number, limit: number, excludeId: number }} params
 * @returns {{ users: User[], total: number, page: number, totalPages: number }}
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
