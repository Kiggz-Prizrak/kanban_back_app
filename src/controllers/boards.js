/**
 * @file HTTP handlers for /api/boards — boards, columns, tasks, members.
 * @module controllers/boards
 */

const taskService = require("../services/tasks");
const boardService = require("../services/boards");
const userBoardService = require("../services/userBoards");
const REGEX = require("../utils/regex");
const { httpError } = require("../utils/httpError");

/**
 * POST /api/boards
 * Body: { title: string, columns?: string[] }
 * Crée un board et rend son créateur admin de celui-ci.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.createBoard = async (req, res) => {
  try {
    const title =
      typeof req.body.title === "string" ? req.body.title.trim() : "";
    const columns = Array.isArray(req.body.columns) ? req.body.columns : [];

    if (!REGEX.title.test(title)) {
      throw httpError(400, "invalid title");
    }

    if (
      columns.length > 0 &&
      !columns.every(
        (value) => typeof value === "string" && REGEX.title.test(value.trim()),
      )
    ) {
      throw httpError(400, "invalid columns");
    }

    const created = await boardService.createBoard({
      userId: req.auth.id,
      title,
      columns,
    });

    return res.status(201).json({
      message: "board created",
      board: created,
      boardId: created.id,
    });
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "An error occurred",
    });
  }
};

/**
 * GET /api/boards/:boardId
 * Retourne le board complet (colonnes, tâches, sous-tâches, membres).
 * Nécessite `loadMembership` — l'appelant doit être membre du board.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.getOneBoard = async (req, res) => {
  try {
    const board = await boardService.getOneBoard({
      boardId: req.params.boardId,
    });

    return res.status(200).json(board);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "Error",
    });
  }
};

/**
 * DELETE /api/boards/:boardId
 * Supprime le board. Réservé à l'admin membership ET au créateur du board
 * (double vérification, voir `services/boards.removeBoard`).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.remove = async (req, res) => {
  try {
    if (!req.membership) {
      const error = new Error("Membership not found");
      error.statusCode = 403;
      throw error;
    }

    if (req.membership.role !== "admin") {
      const error = new Error("Admin role required");
      error.statusCode = 403;
      throw error;
    }

    const result = await boardService.removeBoard({
      boardId: req.params.boardId,
      userId: req.auth.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "An error occurred",
    });
  }
};

/**
 * POST /api/boards/:boardId/new-column
 * Body: { name: string }
 * Ajoute une colonne en fin de board. Admin uniquement.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.addColumn = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!REGEX.title.test(name)) {
      throw httpError(400, "invalid column name");
    }

    const result = await boardService.addColumn({
      boardId: req.params.boardId,
      name,
    });

    return res.status(201).json(result);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "An error occurred",
    });
  }
};

/**
 * PUT /api/boards/:boardId/column/:columnId
 * Body: { name?: string, position?: number }
 * Renomme et/ou repositionne une colonne. Admin uniquement.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.updateColumn = async (req, res) => {
  try {
    const payload = {};

    if (req.body.name !== undefined) {
      const name =
        typeof req.body.name === "string" ? req.body.name.trim() : "";
      if (!REGEX.title.test(name)) {
        throw httpError(400, "invalid column name");
      }
      payload.name = name;
    }

    if (req.body.position !== undefined) {
      payload.position = req.body.position;
    }

    const result = await boardService.updateColumn({
      boardId: req.params.boardId,
      columnId: req.params.columnId,
      ...payload,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "An error occurred",
    });
  }
};

/**
 * DELETE /api/boards/:boardId/column/:columnId
 * Supprime une colonne et ses tâches (cascade DB). Admin uniquement.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.deleteColumn = async (req, res) => {
  try {
    const result = await boardService.deleteColumn({
      boardId: req.params.boardId,
      columnId: req.params.columnId,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "An error occurred",
    });
  }
};

/**
 * POST /api/boards/:boardId/column/:columnId/new-task
 * Body: { title: string, description: string, subtasks?: (string|{title:string})[] }
 * Crée une tâche en fin de colonne. Admin ou member.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.addTask = async (req, res) => {
  try {
    const title =
      typeof req.body.title === "string" ? req.body.title.trim() : "";
    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : "";
    const subtasks = Array.isArray(req.body.subtasks) ? req.body.subtasks : [];

    if (!REGEX.title.test(title)) {
      throw httpError(400, "invalid task title");
    }

    if (!description) {
      throw httpError(400, "invalid task description");
    }

    const result = await boardService.addTask({
      boardId: req.params.boardId,
      columnId: req.params.columnId,
      userId: req.auth.id,
      title,
      description,
      subtasks,
    });

    return res.status(201).json(result);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "An error occurred",
    });
  }
};

/**
 * PUT /api/boards/:boardId/column/:columnId/task/:taskId
 * Body: { title?: string, description?: string, subtasks?: object[] }
 * Met à jour une tâche et, si fourni, resynchronise ses sous-tâches
 * (ajout/mise à jour/suppression par diff). Admin ou member.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.updateTask = async (req, res) => {
  try {
    const payload = {};

    if (req.body.title !== undefined) {
      const title =
        typeof req.body.title === "string" ? req.body.title.trim() : "";
      if (!REGEX.title.test(title)) {
        throw httpError(400, "invalid task title");
      }
      payload.title = title;
    }

    if (req.body.description !== undefined) {
      const description =
        typeof req.body.description === "string"
          ? req.body.description.trim()
          : "";
      if (!description) {
        throw httpError(400, "invalid task description");
      }
      payload.description = description;
    }

    if (req.body.subtasks !== undefined) {
      if (!Array.isArray(req.body.subtasks)) {
        throw httpError(400, "invalid subtasks");
      }
      payload.subtasks = req.body.subtasks;
    }

    const result = await boardService.updateTask({
      boardId: req.params.boardId,
      columnId: req.params.columnId,
      taskId: req.params.taskId,
      ...payload,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "An error occurred",
    });
  }
};

/**
 * PATCH /api/boards/:boardId/tasks/:taskId/move
 * Body: { sourceColumnId: number, destinationColumnId: number, destinationIndex: number }
 * Déplace une tâche entre colonnes (ou la réordonne au sein de la même
 * colonne) et réécrit les positions. Admin ou member — viewer refusé.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.moveTask = async (req, res) => {
  try {
    if (!req.membership || !["admin", "member"].includes(req.membership.role)) {
      const error = new Error("Insufficient permissions");
      error.status = 403;
      throw error;
    }

    const result = await taskService.moveTask({
      boardId: req.params.boardId,
      taskId: req.params.taskId,
      sourceColumnId: req.body.sourceColumnId,
      destinationColumnId: req.body.destinationColumnId,
      destinationIndex: req.body.destinationIndex,
    });

    return res.status(200).json(result);
  } catch (err) {
    const status = err.status || err.statusCode || 500;

    return res.status(status).json({
      message: err.message || "Error",
    });
  }
};

/**
 * DELETE /api/boards/:boardId/column/:columnId/task/:taskId
 * Supprime une tâche. Admin ou member.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.deleteTask = async (req, res) => {
  try {
    const result = await boardService.deleteTask({
      boardId: req.params.boardId,
      columnId: req.params.columnId,
      taskId: req.params.taskId,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;

    return res.status(status).json({
      message: error?.message || "An error occurred",
    });
  }
};

// ===========================
// MEMBERS
// ===========================

/**
 * POST /api/boards/:boardId/new-member
 * Body: { email: string, role?: "admin" | "member" | "viewer" }
 * Recherche l'utilisateur par email et l'ajoute au board. Admin uniquement.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.addMember = async (req, res) => {
  try {
    const email =
      typeof req.body.email === "string" ? req.body.email.trim() : "";
    const role = req.body.role || "member";

    if (!email) throw httpError(400, "Email is required");

    const result = await userBoardService.addMember({
      boardId: req.params.boardId,
      email,
      role,
      requestingUserId: req.auth.id,
    });

    return res.status(201).json(result);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;
    return res
      .status(status)
      .json({ message: error?.message || "An error occurred" });
  }
};

/**
 * PUT /api/boards/:boardId/member/:memberId
 * Body: { role: "admin" | "member" | "viewer" }
 * memberId = id du UserBoard (pas du User). Admin uniquement — un admin ne
 * peut pas changer son propre rôle (voir `services/userBoards.updateMember`).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.updateMember = async (req, res) => {
  try {
    const role = req.body.role;

    if (!role) throw httpError(400, "Role is required");

    const result = await userBoardService.updateMember({
      boardId: req.params.boardId,
      memberId: req.params.memberId,
      role,
      requestingUserId: req.auth.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;
    return res
      .status(status)
      .json({ message: error?.message || "An error occurred" });
  }
};

/**
 * DELETE /api/boards/:boardId/member/:memberId
 * memberId = id du UserBoard. Admin uniquement — un admin ne peut pas se
 * retirer lui-même (voir `services/userBoards.deleteMember`).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.deleteMember = async (req, res) => {
  try {
    const result = await userBoardService.deleteMember({
      boardId: req.params.boardId,
      memberId: req.params.memberId,
      requestingUserId: req.auth.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;
    return res
      .status(status)
      .json({ message: error?.message || "An error occurred" });
  }
};
