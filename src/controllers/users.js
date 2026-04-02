const { promises: fs } = require("fs");
const { cleanupUploadedAvatar } = require("../utils/uploadCleanup");
const authService = require("../services/auth");
const userService = require("../services/users");
const userBoardService = require("../services/userBoards");

const { COOKIE_OPTIONS } = require("../config/cookies");

exports.me = async (req, res) => {
  try {
    const userId = req.auth?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const user = await userService.getOneUser(userId);

    return res.status(200).json({ user });
  } catch (error) {
    console.error("usersController.me error:", error);

    const status = error?.status || error?.statusCode || 500;

    return res.status(status).json({
      error: error?.message || "Internal server error",
    });
  }
};

exports.signup = async (req, res) => {
  try {
    const avatarFile = req.files?.avatar?.[0] || null;

    console.log("REQ BODY:", req.body);
    console.log("REQ FILES:", req.files);

    const signupResult = await authService.signup({
      body: req.body,
      avatarFile,
      protocol: req.protocol,
      host: req.get("host"),
    });

    console.log("SIGNUP RESULT:", signupResult);

    const loginResult = await authService.login({
      email: req.body.email,
      password: req.body.password,
    });

    console.log("LOGIN RESULT:", loginResult);

    const { user, token } = loginResult;

    res.cookie("kanban_access_token", token, COOKIE_OPTIONS);

    return res.status(201).json({ user });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    console.error("STACK:", err.stack);

    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || "Error",
    });
  }
};
exports.login = async (req, res) => {
  try {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
    });

    res.cookie("kanban_access_token", result.token, COOKIE_OPTIONS);

    return res.status(200).json({ user: result.user });
  } catch (err) {
    await cleanupUploadedAvatar(req);
    const status = err.status || 500;
    return res
      .status(status)
      .json({ message: err.message || "An error has occurred" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json(users);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Error" });
  }
};

exports.getOneUser = async (req, res) => {
  try {
    const user = await userService.getOneUser(req.params.id);
    return res.status(200).json(user);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Error" });
  }
};

exports.modifyUser = async (req, res) => {
  try {
    const avatarFile = req.files?.avatar?.[0] || null;

    const result = await userService.modifyUser({
      targetUserId: req.params.id,
      auth: req.auth,
      body: req.body,
      avatarFile,
      protocol: req.protocol,
      host: req.get("host"),
    });

    if (result.avatarWasUpdated && result.oldAvatarUrl) {
      const oldFilename = result.oldAvatarUrl.split("/images/")[1];
      if (oldFilename && oldFilename !== "default_avatar.png") {
        try {
          await fs.unlink(`images/${oldFilename}`);
        } catch (_) {}
      }
    }

    return res.status(200).json({ message: result.message, user: result.user });
  } catch (err) {
    await cleanupUploadedAvatar(req);

    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser({
      targetUserId: req.params.id,
      auth: req.auth,
    });

    if (result.avatarUrl) {
      const filename = result.avatarUrl.split("/images/")[1];

      if (filename && filename !== "default_avatar.png") {
        try {
          await fs.unlink(`images/${filename}`);
        } catch (_) {}
      }
    }

    return res.status(200).json({ message: result.message });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Error" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("kanban_access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  return res.status(200).json({ message: "Déconnecté" });
};
exports.getAffiliatedBoards = async (req, res) => {

  try {
    const userBoards = await userBoardService.getAllUserBoardsById(req.auth.id);

    console.log(userBoards)
    return res.status(200).json(userBoards);
  } catch (error) {
    const status = error?.statusCode || 500;

    return res.status(status).json({
      message: error?.message || "An error occurred",
    });
  }
};
