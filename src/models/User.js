/**
 * @file Sequelize model for user of kanban
 * @module models/User
 */

module.exports = (Sequelize, DataTypes) =>
  Sequelize.define("user", {
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
     * Unique usernameused to identify the user.
     * @type {string}
     */
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    /**
     * avatar url
     * @type {string}
     */
    avatar: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    /**
     * email.
     * @type {string}
     */
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    /**
     * password
     * @type {string}
     */
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });
