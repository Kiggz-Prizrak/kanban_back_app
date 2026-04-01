/**
 * @file Sequelize model for board
 * @module models/Board
 */

module.exports = (Sequelize, DataTypes) =>
  Sequelize.define("board", {
    /**
     * Auto-incremented unique  ID.
     * @type {number}
     */
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },

    /**
     * name of the board
     * @type {string}
     */
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    /**
     * creator of the board
     * @type {string}
     */
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
