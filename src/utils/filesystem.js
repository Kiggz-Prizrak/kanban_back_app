const fs = require("fs/promises");

exports.safeUnlink = async (path) => {
  if (!path) return;
  try {
    await fs.unlink(path);
  } catch (_) {
    // ignore (file missing / already deleted)
  }
};

exports.extractFilenameFromMediaUrl = (mediaUrl) => {
  if (!mediaUrl || typeof mediaUrl !== "string") return null;
  const parts = mediaUrl.split("/images/");
  return parts.length === 2 ? parts[1] : null;
};
