/**
 * @file Middleware to load the current user's membership for a board
 */

const userBoardRepository = require("../repositories/userBoards");

async function loadMembership(req, res, next) {
  try {
    const userId = req.auth?.id;
    const boardId = req.params.boardId;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (!boardId) {
      return res.status(400).json({
        error: "Missing boardId",
      });
    }

    const membership = await userBoardRepository.findByUserIdAndBoardId({
      userId,
      boardId,
    });

    if (!membership) {
      return res.status(403).json({
        error: "You are not a member of this board",
      });
    }

    req.membership = membership;

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = loadMembership;
