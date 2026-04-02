const { Substask } = require("../models");

exports.create = async (data, transaction = null) => {
  return Substask.create(data, { transaction });
};

exports.bulkCreate = async (data, transaction = null) => {
  return Substask.bulkCreate(data, { transaction });
};

exports.findAllByTaskId = async ({ taskId, transaction = null }) => {
  return Substask.findAll({
    where: { taskId },
    order: [["id", "ASC"]],
    transaction,
  });
};

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

exports.deleteById = async (id, transaction = null) => {
  return Substask.destroy({
    where: { id },
    transaction,
  });
};
