/**
 * @file Middleware restreignant une route aux membres admin ou member du board (viewer exclu).
 */

/**
 * Bloque la requête si le rôle de `req.membership` n'est ni "admin" ni
 * "member" (donc si l'utilisateur est "viewer"). Doit être monté après
 * `loadMembership`, qui pose `req.membership`.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const requireMember = (req, res, next) => {
  if (!req.membership) {
    return res.status(500).json({
      error: "Membership not loaded",
    });
  }

  if (!["admin", "member"].includes(req.membership.role)) {
    return res.status(403).json({
      error: "Insufficient permissions — viewer cannot perform this action",
    });
  }

  return next();
}

module.exports = requireMember;
