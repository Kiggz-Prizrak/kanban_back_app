/**
 * @file Middleware restreignant une route aux membres admin du board.
 */

/**
 * Bloque la requête si `req.membership.role !== "admin"`. Doit être monté
 * après `loadMembership`, qui pose `req.membership`.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const requireAdmin = (req, res, next) => {
  if (!req.membership) {
    return res.status(500).json({
      error: "Membership not loaded",
    });
  }

  if (req.membership.role !== "admin") {
    return res.status(403).json({
      error: "Admin role required",
    });
  }

  return next();
};

module.exports = requireAdmin;
