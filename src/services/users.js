const userRepository = require("../repositories/users");
const bcrypt = require("bcrypt");

const { toInt } = require("../utils/parsing");
const {
  safeUnlink,
  extractFilenameFromMediaUrl,
} = require("../utils/filesystem");
const { httpError } = require("../utils/httpError");

const EMAIL_RX = /^[\w\d.+-]+@[\w.-]+\.[a-z]{2,}$/;
const PASSWORD_RX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[_.@$!%*#?&])[A-Za-z\d_.@$!%*#?&]{8,}$/;

exports.getAllUsers = async () => {
  try {
    const users = await userRepository.findAllWithFeed();
    return users;
  } catch (e) {
    throw httpError(400, "bad request");
  }
};

exports.getOneUser = async (id) => {
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw httpError(400, "bad request");
  }

  const user = await userRepository.findOneWithFeedById(userId);

  if (!user) {
    throw httpError(404, "user not found");
  }

  return user;
};

exports.modifyUser = async ({
  targetUserId,
  auth,
  body,
  avatarFile,
  protocol,
  host,
}) => {
  const id = Number(targetUserId);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, "bad request");

  const userModifier = await userRepository.findById(id);
  if (!userModifier) throw httpError(404, "User not found");

  if (userModifier.id !== auth.UserId && !auth.isAdmin) {
    throw httpError(403, "Unauthorized request");
  }

  if (body.email) {
    if (!EMAIL_RX.test(body.email)) throw httpError(400, "email invalide");

    const emailOwner = await userRepository.findByEmail(body.email);
    if (emailOwner && emailOwner.id !== userModifier.id) {
      throw httpError(400, "email or username already used");
    }
  }

  if (body.username) {
    const usernameOwner = await userRepository.findByUsername(body.username);
    if (usernameOwner && usernameOwner.id !== userModifier.id) {
      throw httpError(400, "email or username already used");
    }
  }

  const patch = { ...body };

  if (body.password) {
    if (!PASSWORD_RX.test(body.password)) {
      throw httpError(400, "mot de passe invalide");
    }
    patch.password = await bcrypt.hash(body.password, 10);

    if (body.email && typeof body.email !== "string") {
      throw httpError(400, "please provides all fields");
    }
  }

  if (avatarFile?.filename) {
    patch.avatar = `${protocol}://${host}/images/${avatarFile.filename}`;
  }

  delete patch.isAdmin;
  delete patch.id;

  await userRepository.updateById(userModifier.id, patch);

  const updatedUser = await userRepository.findById(userModifier.id);

  const oldAvatarUrl = userModifier.avatar;

  return {
    message: "User modifié",
    user: updatedUser,
    oldAvatarUrl,
    avatarWasUpdated: Boolean(avatarFile?.filename),
  };
};

exports.deleteUser = async ({ targetUserId, auth }) => {
  const id = Number(targetUserId);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, "bad request");
  }

  const user = await userRepository.findById(id);
  if (!user) {
    throw httpError(404, "User not found");
  }

  if (user.id !== auth.UserId && !auth.isAdmin) {
    throw httpError(401, "Unauthorized request");
  }

  await userRepository.deleteById(user.id);

  return {
    message: "Objet supprimé !",
    avatarUrl: user.avatar,
  };
};
