const { User, UserBoard, Board } = require("../models");

/* =========================
   CRUD simples
========================= */

exports.findById = async (id) => {
  return User.findOne({ where: { id } });
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
