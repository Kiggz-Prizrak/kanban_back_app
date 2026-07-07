/**
 * @file Middleware to load the current user's membership for a board
 */

const userBoardRepository = require("../repositories/userBoards");

/**
 * Charge le `UserBoard` (membership) de l'utilisateur authentifié pour le
 * board ciblé par `req.params.boardId` et le pose dans `req.membership`.
 * Doit être monté après le middleware `auth` sur toute route `/:boardId/*`.
 * Répond 403 si l'utilisateur n'est pas membre du board.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
const loadMembership = async (req, res, next) => {
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
};

module.exports = loadMembership;
