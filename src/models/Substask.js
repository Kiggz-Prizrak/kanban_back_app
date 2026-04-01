/**
 * @file Sequelize model for substacsk of the task's board
 * @module models/Column
 */

module.exports = (Sequelize, DataTypes) =>
  Sequelize.define("substask", {
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
     * title of the substack
     * @type {string}
     */
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });
