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
