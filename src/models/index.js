/**
 * @file Sequelize database initialization and model loader
 */

const { Sequelize, DataTypes } = require("sequelize");
const dbConfig = require("../config/db.config");
require("dotenv").config();

const sequelize =
  dbConfig.dialect === "sqlite"
    ? new Sequelize({
        dialect: "sqlite",
        storage: dbConfig.storage,
        logging: false,
      })
    : new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
        host: dbConfig.HOST,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        charset: "utf8mb4",
        logging: false,
        pool: dbConfig.pool,
      });

const User = require("./User")(sequelize, DataTypes);
const UserBoard = require("./UserBoard")(sequelize, DataTypes);
const Board = require("./Board")(sequelize, DataTypes);
const Column = require("./Column")(sequelize, DataTypes);
const Task = require("./Task")(sequelize, DataTypes);
const Substask = require("./Substask")(sequelize, DataTypes);
/**
 * =========================
 * USER ↔ MEMBERSHIPS
 * =========================
 */
User.hasMany(UserBoard, {
  foreignKey: "userId",
  as: "memberships",
  onDelete: "CASCADE",
});

UserBoard.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

/**
 * =========================
 * BOARD ↔ MEMBERSHIPS
 * =========================
 */
Board.hasMany(UserBoard, {
  foreignKey: "boardId",
  as: "memberships",
  onDelete: "CASCADE",
});

UserBoard.belongsTo(Board, {
  foreignKey: "boardId",
  as: "board",
});

/**
 * =========================
 * BOARD CREATOR
 * =========================
 */
User.hasMany(Board, {
  foreignKey: "createdByUserId",
  as: "createdBoards",
});

Board.belongsTo(User, {
  foreignKey: "createdByUserId",
  as: "creator",
});

/**
 * =========================
 * BOARD → COLUMN
 * =========================
 */
Board.hasMany(Column, {
  foreignKey: "boardId",
  as: "columns",
  onDelete: "CASCADE",
});

Column.belongsTo(Board, {
  foreignKey: "boardId",
  as: "board",
});

/**
 * =========================
 * COLUMN → TASK
 * =========================
 */
Column.hasMany(Task, {
  foreignKey: "columnId",
  as: "tasks",
  onDelete: "CASCADE",
});

Task.belongsTo(Column, {
  foreignKey: "columnId",
  as: "column",
});

/**
 * =========================
 * TASK → SUBTASK
 * =========================
 */
Task.hasMany(Substask, {
  foreignKey: "taskId",
  as: "substasks",
  onDelete: "CASCADE",
});

Substask.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

/**
 * =========================
 * TASK CREATOR
 * =========================
 */
User.hasMany(Task, {
  foreignKey: "createdByUserId",
  as: "createdTasks",
});

Task.belongsTo(User, {
  foreignKey: "createdByUserId",
  as: "creator",
});
async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log(`🔗 Connected to ${dbConfig.dialect.toUpperCase()} database`);

    if (process.env.DROP_DATABASE_AT_LAUNCH === "1") {
      if (dbConfig.dialect === "mysql") {
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;");
      }

      await sequelize.drop();

      if (dbConfig.dialect === "mysql") {
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;");
      }

      console.log("🗑️ Tables dropped successfully");
    }

    await sequelize.sync();
    console.log("✅ Database synchronized");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

module.exports = {
  sequelize,
  initDatabase,
  User,
  UserBoard,
  Board,
  Column,
  Task,
  Substask,
};
