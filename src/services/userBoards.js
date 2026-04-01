/**
 * @file userBoards service
 */

const userBoardsRepositories = require("../repositories/userBoards");

exports.getMembershipForUser = async ({ userBoardId, userId, boardId }) => {
  if (!userBoardId) {
    const error = new Error("Missing userBoardId");
    error.statusCode = 400;
    throw error;
  }

  if (!userId) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
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
    const error = new Error("You are not a member of this board");
    error.statusCode = 403;
    throw error;
  }

  return userBoard;
};

exports.assertAdminMembership = (userBoard) => {
  if (!userBoard) {
    const error = new Error("Membership not loaded before role check");
    error.statusCode = 500;
    throw error;
  }

  if (userBoard.role !== "admin") {
    const error = new Error("Admin role required");
    error.statusCode = 403;
    throw error;
  }
};

exports.getAllUserBoardsById = async (id) => {
  console.log(id);
  try {
    return await userBoardsRepositories.findAllByUserId(id);
  } catch (e) {
    const err = new Error("Failed to fetch affiliated boards");
    err.statusCode = 500;
    throw err;
  }
};
