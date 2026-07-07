/**
 * @file HTTP handlers for /api/users — auth, profile, search.
 * @module controllers/users
 */

const { promises: fs } = require("fs");
const { cleanupUploadedAvatar } = require("../utils/uploadCleanup");
const authService = require("../services/auth");
const userService = require("../services/users");
const userBoardService = require("../services/userBoards");

const { COOKIE_OPTIONS } = require("../config/cookies");

/**
 * GET /api/users/me
 * Retourne le profil de l'utilisateur authentifié (via req.auth, posé par
 * le middleware `auth`).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.me = async (req, res) => {
  try {
    const userId = req.auth?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await userService.getOneUser(userId);
    return res.status(200).json({ user });
  } catch (error) {
    const status = error?.statusCode || error?.status || 500;
    return res
      .status(status)
      .json({ error: error?.message || "Internal server error" });
  }
};

/**
 * POST /api/users/signup — multipart/form-data (username, email, password, avatar?)
 * Crée le compte puis connecte immédiatement l'utilisateur (pose le cookie JWT).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.signup = async (req, res) => {
  try {
    const avatarFile = req.files?.avatar?.[0] || null;

    await authService.signup({
      body: req.body,
      avatarFile,
      protocol: req.protocol,
      host: req.get("host"),
    });

    const loginResult = await authService.login({
      email: req.body.email,
      password: req.body.password,
    });

    const { user, token } = loginResult;

    res.cookie("kanban_access_token", token, COOKIE_OPTIONS);
    return res.status(201).json({ user });
  } catch (err) {
    const status = err.statusCode || err.status || 500;
    return res.status(status).json({ message: err.message || "Error" });
  }
};

/**
 * POST /api/users/login — body JSON { email, password }
 * Vérifie les identifiants et pose le cookie JWT httpOnly.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.login = async (req, res) => {
  try {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
    });

    res.cookie("kanban_access_token", result.token, COOKIE_OPTIONS);
    return res.status(200).json({ user: result.user });
  } catch (err) {
    await cleanupUploadedAvatar(req);
    const status = err.statusCode || err.status || 500;
    return res
      .status(status)
      .json({ message: err.message || "An error has occurred" });
  }
};

/**
 * POST /api/users/logout
 * Efface le cookie JWT httpOnly.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
exports.logout = (req, res) => {
  res.clearCookie("kanban_access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  return res.status(200).json({ message: "Déconnecté" });
};

/**
 * GET /api/users/:id
 * Retourne le profil public d'un utilisateur.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.getOneUser = async (req, res) => {
  try {
    const user = await userService.getOneUser(req.params.id);
    return res.status(200).json(user);
  } catch (err) {
    const status = err.statusCode || err.status || 500;
    return res.status(status).json({ message: err.message || "Error" });
  }
};

/**
 * GET /api/users/search?q=username&page=1&limit=10
 * Recherche paginée — authentifié uniquement
 * Retourne : { users, total, page, totalPages }
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.searchUsers = async (req, res) => {
  try {
    const result = await userService.searchUsers({
      q: req.query.q,
      page: req.query.page,
      limit: req.query.limit,
      requestingUserId: req.auth.id,
    });

    return res.status(200).json(result);
  } catch (err) {
    const status = err.status || err.statusCode || 500;
    return res.status(status).json({ message: err.message || "Error" });
  }
};

/**
 * PATCH /api/users/:id — multipart/form-data
 * Modifie le profil ciblé. Réservé à l'utilisateur lui-même (voir
 * `services/users.modifyUser`). Supprime l'ancien avatar sur disque si un
 * nouveau a été uploadé.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.modifyUser = async (req, res) => {
  try {
    const avatarFile = req.files?.avatar?.[0] || null;

    const result = await userService.modifyUser({
      targetUserId: req.params.id,
      auth: req.auth,
      body: req.body,
      avatarFile,
      protocol: req.protocol,
      host: req.get("host"),
    });

    if (result.avatarWasUpdated && result.oldAvatarUrl) {
      const oldFilename = result.oldAvatarUrl.split("/images/")[1];
      if (oldFilename && oldFilename !== "default_avatar.png") {
        try {
          await fs.unlink(`images/${oldFilename}`);
        } catch (_) {}
      }
    }

    return res.status(200).json({ message: result.message, user: result.user });
  } catch (err) {
    await cleanupUploadedAvatar(req);
    const status = err.statusCode || err.status || 500;
    return res.status(status).json({ message: err.message || "Error" });
  }
};

/**
 * DELETE /api/users/:id
 * Supprime le compte ciblé. Réservé à l'utilisateur lui-même (voir
 * `services/users.deleteUser`). Supprime l'avatar sur disque le cas échéant.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser({
      targetUserId: req.params.id,
      auth: req.auth,
    });

    if (result.avatarUrl) {
      const filename = result.avatarUrl.split("/images/")[1];
      if (filename && filename !== "default_avatar.png") {
        try {
          await fs.unlink(`images/${filename}`);
        } catch (_) {}
      }
    }

    return res.status(200).json({ message: result.message });
  } catch (err) {
    const status = err.statusCode || err.status || 500;
    return res.status(status).json({ message: err.message || "Error" });
  }
};

/**
 * GET /api/users/boards-member
 * Liste les boards dont l'utilisateur authentifié est membre.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
exports.getAffiliatedBoards = async (req, res) => {
  try {
    const userBoards = await userBoardService.getAllUserBoardsById(req.auth.id);
    return res.status(200).json(userBoards);
  } catch (error) {
    const status = error?.statusCode || 500;
    return res
      .status(status)
      .json({ message: error?.message || "An error occurred" });
  }
};
