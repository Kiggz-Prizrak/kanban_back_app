/**
 * @file Sequelize model for board column
 * @module models/Column
 */

module.exports = (Sequelize, DataTypes) =>
  Sequelize.define("column", {
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
     * name of the column
     * @type {string}
     */
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });
