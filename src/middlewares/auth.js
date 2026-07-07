/**
 * @file Authentication middleware — verifies the JWT and populates req.auth.
 * @module middlewares/auth
 */

const jwt = require("jsonwebtoken");

/**
 * Vérifie le JWT porté soit par le header `Authorization: Bearer <token>`
 * (clients non-navigateur : Postman, Insomnia, mobile), soit par le cookie
 * httpOnly `kanban_access_token` (navigateur). Le Bearer est prioritaire
 * s'il est présent. Pose `req.auth = { id }` (payload du token) en cas de
 * succès.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
module.exports = (req, res, next) => {
  // Bearer token (Insomnia / Postman / mobile)
  const header =
    typeof req.headers.authorization === "string"
      ? req.headers.authorization
      : "";

  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;

  //  Cookie HTTP-only
  const cookieToken = req.cookies?.kanban_access_token || null;

  // Priority: Bearer > Cookie
  const token = bearer || cookieToken;

  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  //  chekc JWT
  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return next();
  } catch (err) {
    const body = { error: "Invalid or expired token" };
    if (process.env.NODE_ENV !== "production") {
      body.reason = err.name;
    }
    return res.status(401).json(body);
  }
};
