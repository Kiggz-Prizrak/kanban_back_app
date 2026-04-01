/**
 * @file Sequelize model for board membership
 * @module models/UserBoard
 */

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "user_board",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      role: {
        type: DataTypes.ENUM("admin", "member", "viewer"),
        allowNull: false,
        defaultValue: "member",
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      boardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["userId", "boardId"],
        },
      ],
    },
  );
