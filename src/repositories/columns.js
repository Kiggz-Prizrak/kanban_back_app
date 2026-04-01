const { Column } = require("../models");

exports.bulkCreate = async (data, transaction) => {
  return Column.bulkCreate(data, { transaction });
};
