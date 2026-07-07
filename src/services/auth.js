/**
 * @file Business logic for signup/login.
 * @module services/auth
 */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/users");

const NAME_RX =
  /^[\wàèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœ\d '-]+$/;

const EMAIL_RX = /^[\w\d.+-]+@[\w.-]+\.[a-z]{2,}$/;

const PASSWORD_RX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[_.@$!%*#?&])[A-Za-z\d_.@$!%*#?&]{8,}$/;

const { httpError } = require("../utils/httpError");

// Hash bidon utilisé pour égaliser le temps de réponse quand l'email
// n'existe pas — évite de fuiter l'existence d'un compte via bcrypt.compare
// jamais appelé (ou via une différence de timing).
const DUMMY_HASH =
  "$2b$10$TrdrHm61.W1b6xIPSXAPRu19VdfNdBtOEoFo8TOwJNEjY7HivgbMG";

/**
 * Crée un compte utilisateur. Ne connecte pas l'utilisateur — voir
 * `controllers/users.signup` qui enchaîne avec `login`.
 * @param {{ body: { email: string, password: string, username: string }, avatarFile: Express.Multer.File|null, protocol: string, host: string }} params
 * @returns {Promise<{ message: string }>}
 * @throws {Error} 400 si un champ est invalide ou si l'email/username est déjà pris.
 */
exports.signup = async ({ body, avatarFile, protocol, host }) => {
  const { email, password, username } = body || {};

  const isValidTypes =
    typeof email === "string" &&
    typeof password === "string" &&
    typeof username === "string";

  if (!isValidTypes) {
    throw httpError(400, "Please provide valid data");
  }

  const nameFields = [username];
  if (!nameFields.every((v) => NAME_RX.test(v))) {
    throw httpError(400, "champs invalide");
  }

  if (!EMAIL_RX.test(email)) {
    throw httpError(400, "email invalide");
  }

  if (!PASSWORD_RX.test(password)) {
    throw httpError(400, "mot de passe invalide");
  }

  const [emailExists, usernameExists] = await Promise.all([
    userRepository.findByEmail(email),
    userRepository.findByUsername(username),
  ]);

  if (emailExists || usernameExists) {
    throw httpError(400, "email or username already used");
  }

  const hash = await bcrypt.hash(password, 10);

  // Default avatar (propre, basé sur l’host courant)
  const baseUrl = `${protocol}://${host}`;
  const defaultAvatar = `${baseUrl}/images/default_avatar.png`;

  const avatar = avatarFile?.filename
    ? `${baseUrl}/images/${avatarFile.filename}`
    : defaultAvatar;

  await userRepository.create({
    email: body.email,
    password: hash,
    username: body.username,
    avatar,
  });

  return { message: "Utilisateur créé" };
};

/**
 * Vérifie les identifiants et émet un JWT (HS256, `{ id }`, expiration
 * `JWT_EXPIRES_IN`). Renvoie toujours le même statut/message qu'il
 * s'agisse d'un email inconnu ou d'un mot de passe invalide, et compare
 * systématiquement contre un hash (réel ou bidon), pour ne pas fuiter
 * l'existence d'un compte via le statut ou le timing de la réponse.
 * @param {{ email: string, password: string }} params
 * @returns {Promise<{ user: object, token: string }>} `user` sans le mot de passe.
 * @throws {Error} 400 si email/password ne sont pas des chaînes.
 * @throws {Error} 401 si l'email est inconnu ou le mot de passe invalide.
 * @throws {Error} 500 si `JWT_SECRET` n'est pas configuré.
 */
exports.login = async ({ email, password }) => {
  if (typeof email !== "string" || typeof password !== "string") {
    throw httpError(400, "please provides valid data");
  }

  const user = await userRepository.findByEmail(email);

  // Compare toujours contre un hash (réel ou bidon) pour ne pas fuiter
  // l'existence d'un compte via le statut ou le timing de la réponse.
  const valid = await bcrypt.compare(password, user?.password || DUMMY_HASH);

  if (!user || !valid) {
    throw httpError(401, "Invalid email or password");
  }

  if (!process.env.JWT_SECRET) {
    throw httpError(500, "JWT secret is missing (JWT_SECRET)");
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });

  const safeUser = user.toJSON ? user.toJSON() : { ...user };
  delete safeUser.password;

  return { user: safeUser, token };
};
