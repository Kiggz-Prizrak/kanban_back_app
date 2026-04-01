/**
 * @file Sequelize model for task's board
 * @module models/Column
 */

module.exports = (Sequelize, DataTypes) =>
  Sequelize.define("task", {
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
     * title of the task
     * @type {string}
     */
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    /**
     * description of the task
     * @type {string}
     */
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    /**
     * description of the task
     * @type {string}
     */
    createdByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });
