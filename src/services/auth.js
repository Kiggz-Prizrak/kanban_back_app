const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/users");

const NAME_RX =
  /^[\wàèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœ\d '-]+$/;

const EMAIL_RX = /^[\w\d.+-]+@[\w.-]+\.[a-z]{2,}$/;

const PASSWORD_RX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[_.@$!%*#?&])[A-Za-z\d_.@$!%*#?&]{8,}$/;

const { httpError } = require("../utils/httpError");

exports.signup = async ({ body, avatarFile, protocol, host }) => {
  const { email, password, username, firstName, lastName } = body || {};

  const isValidTypes =
    typeof email === "string" &&
    typeof password === "string" &&
    typeof username === "string" &&
    typeof firstName === "string" &&
    typeof lastName === "string";

  if (!isValidTypes) {
    throw httpError(400, "Please provide valid data");
  }

  const nameFields = [username, lastName, firstName];
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

  const { isAdmin, ...safeBody } = body;

  // Default avatar (propre, basé sur l’host courant)
  const baseUrl = `${protocol}://${host}`;
  const defaultAvatar = `${baseUrl}/images/default_avatar.png`;

  const avatar = avatarFile?.filename
    ? `${baseUrl}/images/${avatarFile.filename}`
    : defaultAvatar;

  await userRepository.create({
    isAdmin: false,
    email: safeBody.email,
    password: hash,
    username: safeBody.username,
    firstName: safeBody.firstName,
    lastName: safeBody.lastName,
    avatar,
  });

  return { message: "Utilisateur créé" };
};

exports.login = async ({ email, password }) => {
  if (typeof email !== "string" || typeof password !== "string") {
    throw httpError(400, "please provides valid data");
  }

  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw httpError(404, "no user match with this mail");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw httpError(401, "Invalid email or password");
  }

  if (!process.env.JWT_SECRET) {
    throw httpError(500, "JWT secret is missing (JWT_SECRET)");
  }

  const token = jwt.sign(
    { UserId: user.id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
  );

  const safeUser = user.toJSON ? user.toJSON() : { ...user };
  delete safeUser.password;

  return { user: safeUser, token };
};
