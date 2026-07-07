/**
 * @file Rate limiters for brute-force / enumeration-sensitive routes.
 * @module middlewares/rateLimit
 */

const rateLimit = require("express-rate-limit");

/**
 * Limite les tentatives de login/signup à 10 par IP toutes les 15 minutes.
 * Cible le brute-force de mot de passe et le credential stuffing.
 * @type {import('express').RequestHandler}
 */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // 10 tentatives / IP / fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});

/**
 * Limite la recherche d'utilisateurs à 30 requêtes par IP par minute.
 * Empêche le scraping massif de la liste des utilisateurs.
 * @type {import('express').RequestHandler}
 */
exports.searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
