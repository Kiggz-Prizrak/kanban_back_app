/**
 * @file userBoards service
 */

const userBoardsRepositories = require("../repositories/userBoards");
const userRepository = require("../repositories/users");
const { toInt } = require("../utils/parsing");
const { httpError } = require("../utils/httpError");

exports.getMembershipForUser = async ({ userBoardId, userId, boardId }) => {
  if (!userBoardId) {
    throw httpError(400, "Missing userBoardId");
  }

  if (!userId) {
    throw httpError(401, "Unauthorized");
  }

  const userBoard = boardId
    ? await userBoardsRepositories.findByIdUserIdAndBoardId({
        userBoardId,
        userId,
        boardId,
      })
    : await userBoardsRepositories.findByIdAndUserId({
        userBoardId,
        userId,
      });

  if (!userBoard) {
    throw httpError(403, "You are not a member of this board");
  }

  return userBoard;
};

exports.assertAdminMembership = (userBoard) => {
  if (!userBoard) {
    throw httpError(500, "Membership not loaded before role check");
  }

  if (userBoard.role !== "admin") {
    throw httpError(403, "Admin role required");
  }
};

exports.getAllUserBoardsById = async (id) => {
  try {
    return await userBoardsRepositories.findAllByUserId(id);
  } catch (e) {
    throw httpError(500, "Failed to fetch affiliated boards");
  }
};

/**
 * Ajoute un membre au board.
 * L'admin fournit l'email de l'utilisateur à ajouter + son rôle.
 * @param {{ boardId: number, email: string, role?: string, requestingUserId: number }} params
 */
exports.addMember = async ({
  boardId,
  email,
  role = "member",
  requestingUserId,
}) => {
  const parsedBoardId = toInt(boardId);
  if (!parsedBoardId) throw httpError(400, "Invalid board id");

  const VALID_ROLES = ["admin", "member", "viewer"];
  if (!VALID_ROLES.includes(role)) {
    throw httpError(
      400,
      `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
    );
  }

  // Trouve l'utilisateur cible par email
  const targetUser = await userRepository.findByEmail(email);
  if (!targetUser) {
    throw httpError(404, "No user found with this email");
  }

  // Empêche de s'ajouter soi-même (déjà membre en tant qu'admin)
  if (Number(targetUser.id) === Number(requestingUserId)) {
    throw httpError(400, "You are already a member of this board");
  }

  // Vérifie que l'user n'est pas déjà membre
  const existing = await userBoardsRepositories.findByUserIdAndBoardId({
    userId: targetUser.id,
    boardId: parsedBoardId,
  });

  if (existing) {
    throw httpError(409, "This user is already a member of this board");
  }

  const membership = await userBoardsRepositories.create({
    userId: targetUser.id,
    boardId: parsedBoardId,
    role,
  });

  return {
    message: "Member added successfully",
    membership: {
      id: membership.id,
      userId: targetUser.id,
      boardId: parsedBoardId,
      role: membership.role,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        avatar: targetUser.avatar,
      },
    },
  };
};

/**
 * Met à jour le rôle d'un membership existant.
 * memberId = id du UserBoard, pas du User.
 * L'admin ne peut pas changer son propre rôle.
 * @param {{ boardId: number, memberId: number, role: string, requestingUserId: number }} params
 */
exports.updateMember = async ({
  boardId,
  memberId,
  role,
  requestingUserId,
}) => {
  const parsedBoardId = toInt(boardId);
  const parsedMemberId = toInt(memberId);

  if (!parsedBoardId || !parsedMemberId) {
    throw httpError(400, "Invalid board id or member id");
  }

  const VALID_ROLES = ["admin", "member", "viewer"];
  if (!VALID_ROLES.includes(role)) {
    throw httpError(
      400,
      `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
    );
  }

  const membership = await userBoardsRepositories.findByIdAndBoardId({
    id: parsedMemberId,
    boardId: parsedBoardId,
  });

  if (!membership) {
    throw httpError(404, "Membership not found");
  }

  // Empêche l'admin de changer son propre rôle (évite de se rétrograder)
  if (Number(membership.userId) === Number(requestingUserId)) {
    throw httpError(400, "You cannot change your own role");
  }

  const updated = await userBoardsRepositories.updateById(parsedMemberId, {
    role,
  });

  return {
    message: "Member updated successfully",
    membership: updated,
  };
};

/**
 * Retire un membre du board.
 * memberId = id du UserBoard.
 * L'admin ne peut pas se retirer lui-même.
 * @param {{ boardId: number, memberId: number, requestingUserId: number }} params
 */
exports.deleteMember = async ({ boardId, memberId, requestingUserId }) => {
  const parsedBoardId = toInt(boardId);
  const parsedMemberId = toInt(memberId);

  if (!parsedBoardId || !parsedMemberId) {
    throw httpError(400, "Invalid board id or member id");
  }

  const membership = await userBoardsRepositories.findByIdAndBoardId({
    id: parsedMemberId,
    boardId: parsedBoardId,
  });

  if (!membership) {
    throw httpError(404, "Membership not found");
  }

  // L'admin ne peut pas se retirer lui-même
  if (Number(membership.userId) === Number(requestingUserId)) {
    throw httpError(400, "You cannot remove yourself from the board");
  }

  await userBoardsRepositories.deleteById(parsedMemberId);

  return {
    message: "Member removed successfully",
    memberId: parsedMemberId,
  };
};
