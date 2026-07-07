const rateLimit = require("express-rate-limit");

// Login/signup : peu de tentatives, fenêtre courte — cible le brute-force
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // 10 tentatives / IP / fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});

// Search : plus permissif, juste pour éviter le scraping massif
exports.searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
