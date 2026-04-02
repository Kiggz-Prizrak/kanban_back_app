const { Board, User, UserBoard, Column, Task, Substask } = require("../models");

exports.create = async (data, transaction) => {
  return Board.create(data, { transaction });
};

exports.findById = async (id, transaction = null) => {
  return Board.findOne({
    where: { id },
    include: [
      {
        model: User,
        as: "creator",
        attributes: ["id", "username", "email"],
      },
      {
        model: UserBoard,
        as: "memberships",
        attributes: ["id", "role", "userId", "boardId"],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "username", "email"],
          },
        ],
      },
      {
        model: Column,
        as: "columns",
        attributes: ["id", "name", "boardId"],
        include: [
          {
            model: Task,
            as: "tasks",
            attributes: [
              "id",
              "title",
              "description",
              "columnId",
              "createdByUserId",
              "createdAt",
              "updatedAt",
            ],
            include: [
              {
                model: User,
                as: "creator",
                attributes: ["id", "username", "email"],
              },
              {
                model: Substask,
                as: "substasks",
                attributes: ["id", "title", "isCompleted", "taskId"],
              },
            ],
          },
        ],
      },
    ],
    order: [
      [{ model: Column, as: "columns" }, "position", "ASC"],
      [
        { model: Column, as: "columns" },
        { model: Task, as: "tasks" },
        "position",
        "ASC",
      ],
    ],
    transaction,
  });
};

exports.deleteById = async (id, transaction = null) => {
  return Board.destroy({
    where: { id },
    transaction,
  });
};
