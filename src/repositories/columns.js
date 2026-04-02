const { Column } = require("../models");

exports.bulkCreate = async (data, transaction) => {
  return Column.bulkCreate(data, { transaction });
};

exports.create = async (data, transaction = null) => {
  return Column.create(data, { transaction });
};

exports.findByIdInBoard = async ({ boardId, columnId, transaction = null }) => {
  return Column.findOne({
    where: {
      id: columnId,
      boardId,
    },
    transaction,
  });
};

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

exports.deleteById = async (id, transaction = null) => {
  return Column.destroy({
    where: { id },
    transaction,
  });
};
