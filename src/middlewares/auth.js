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
