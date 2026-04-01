const jwt = require("jsonwebtoken");

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
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
      reason: err.name, // utile en dev
    });
  }
};
