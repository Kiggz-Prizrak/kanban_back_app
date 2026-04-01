function requireAdmin(req, res, next) {
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
}

module.exports = requireAdmin;
