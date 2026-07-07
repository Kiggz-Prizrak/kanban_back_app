/**
 * @file Business logic for user profile management and search.
 * @module services/users
 */

const userRepository = require("../repositories/users");
const bcrypt = require("bcrypt");

const { toInt } = require("../utils/parsing");
const { httpError } = require("../utils/httpError");

const EMAIL_RX = /^[\w\d.+-]+@[\w.-]+\.[a-z]{2,}$/;
const PASSWORD_RX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[_.@$!%*#?&])[A-Za-z\d_.@$!%*#?&]{8,}$/;

const SEARCH_MAX_LENGTH = 100;
const SEARCH_MAX_LIMIT = 50;
const SEARCH_DEFAULT_LIMIT = 10;

/**
 * @deprecated Route désactivée côté `routes/users.js` (utiliser `searchUsers`).
 * @returns {Promise<import('../models').User[]>}
 * @throws {Error} 400 en cas d'échec de la requête.
 */
exports.getAllUsers = async () => {
  try {
    const users = await userRepository.findAllWithFeed();
    return users;
  } catch (e) {
    throw httpError(400, "bad request");
  }
};

/**
 * @param {number|string} id
 * @returns {Promise<import('../models').User>}
 * @throws {Error} 400 si l'id n'est pas un entier positif.
 * @throws {Error} 404 si l'utilisateur n'existe pas.
 */
exports.getOneUser = async (id) => {
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw httpError(400, "bad request");
  }

  const user = await userRepository.findById(userId);

  if (!user) {
    throw httpError(404, "user not found");
  }

  return user;
};

/**
 * Recherche paginée d'utilisateurs par username ou email.
 * Sécurités :
 * - Longueur max du terme de recherche
 * - Limite de résultats par page plafonnée
 * - Page minimum = 1
 * - Exclusion de l'utilisateur courant
 * @param {{ q?: string, page?: number, limit?: number, requestingUserId: number }} params
 * @returns {Promise<{ users: object[], total: number, page: number, totalPages: number }>}
 * @throws {Error} 401 si `requestingUserId` est manquant.
 */
exports.searchUsers = async ({ q, page, limit, requestingUserId }) => {
  // Sanitize le terme de recherche
  const safeTerm =
    typeof q === "string" ? q.trim().slice(0, SEARCH_MAX_LENGTH) : "";

  // Sanitize page
  const safePage = Math.max(1, toInt(page) || 1);

  // Sanitize limit — plafond à 50 pour éviter les dumps massifs
  const rawLimit = toInt(limit) || SEARCH_DEFAULT_LIMIT;
  const safeLimit = Math.min(Math.max(1, rawLimit), SEARCH_MAX_LIMIT);

  if (!requestingUserId) {
    throw httpError(401, "Unauthorized");
  }

  return userRepository.searchByUsername({
    q: safeTerm,
    page: safePage,
    limit: safeLimit,
    excludeId: requestingUserId,
  });
};

/**
 * Modifie le profil ciblé. Réservé à l'utilisateur lui-même (`auth.id`
 * doit correspondre à `targetUserId`) — il n'existe pas de rôle admin
 * global dans ce système, seulement des rôles par board.
 * @param {{ targetUserId: number|string, auth: { id: number }, body: object, avatarFile: Express.Multer.File|null, protocol: string, host: string }} params
 * @returns {Promise<{ message: string, user: object, oldAvatarUrl: string, avatarWasUpdated: boolean }>}
 * @throws {Error} 400 si l'id est invalide, l'email/mot de passe invalide, ou email/username déjà pris.
 * @throws {Error} 403 si l'appelant n'est pas le propriétaire du profil.
 * @throws {Error} 404 si l'utilisateur ciblé n'existe pas.
 */
exports.modifyUser = async ({
  targetUserId,
  auth,
  body,
  avatarFile,
  protocol,
  host,
}) => {
  const id = Number(targetUserId);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, "bad request");

  const userModifier = await userRepository.findById(id);
  if (!userModifier) throw httpError(404, "User not found");

  if (Number(userModifier.id) !== Number(auth.id)) {
    throw httpError(403, "Unauthorized request");
  }

  if (body.email) {
    if (!EMAIL_RX.test(body.email)) throw httpError(400, "email invalide");

    const emailOwner = await userRepository.findByEmail(body.email);
    if (emailOwner && emailOwner.id !== userModifier.id) {
      throw httpError(400, "email or username already used");
    }
  }

  if (body.username) {
    const usernameOwner = await userRepository.findByUsername(body.username);
    if (usernameOwner && usernameOwner.id !== userModifier.id) {
      throw httpError(400, "email or username already used");
    }
  }

  const patch = { ...body };

  if (body.password) {
    if (!PASSWORD_RX.test(body.password)) {
      throw httpError(400, "mot de passe invalide");
    }
    patch.password = await bcrypt.hash(body.password, 10);
  }

  if (avatarFile?.filename) {
    patch.avatar = `${protocol}://${host}/images/${avatarFile.filename}`;
  }

  delete patch.isAdmin;
  delete patch.id;

  await userRepository.updateById(userModifier.id, patch);

  const updatedUser = await userRepository.findById(userModifier.id);

  return {
    message: "User modifié",
    user: updatedUser,
    oldAvatarUrl: userModifier.avatar,
    avatarWasUpdated: Boolean(avatarFile?.filename),
  };
};

/**
 * Supprime le compte ciblé. Réservé à l'utilisateur lui-même (`auth.id`
 * doit correspondre à `targetUserId`).
 * @param {{ targetUserId: number|string, auth: { id: number } }} params
 * @returns {Promise<{ message: string, avatarUrl: string }>}
 * @throws {Error} 400 si l'id est invalide.
 * @throws {Error} 403 si l'appelant n'est pas le propriétaire du compte.
 * @throws {Error} 404 si l'utilisateur ciblé n'existe pas.
 */
exports.deleteUser = async ({ targetUserId, auth }) => {
  const id = Number(targetUserId);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, "bad request");
  }

  const user = await userRepository.findById(id);
  if (!user) {
    throw httpError(404, "User not found");
  }

  if (Number(user.id) !== Number(auth.id)) {
    throw httpError(403, "Unauthorized request");
  }

  await userRepository.deleteById(user.id);

  return {
    message: "Objet supprimé !",
    avatarUrl: user.avatar,
  };
};
