const express = require("express");
const cookieParser = require("cookie-parser");

const userRoutes = require("./routes/users");
const boardRoutes = require("./routes/boards");

const app = express();

/**
 * =========================
 * CORE MIDDLEWARES
 * =========================
 */
app.use(express.json());
app.use(cookieParser());
app.use("/images", express.static("./images"));

/**
 * =========================
 * CORS
 * =========================
 */
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Accept, Content-Type, Authorization",
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

/**
 * =========================
 * HEALTHCHECK
 * =========================
 */
app.get("/api/health", (req, res) => {
  return res.status(200).json({ status: "ok" });
});

/**
 * =========================
 * ROUTES
 * =========================
 */
app.use("/api/users", userRoutes);
app.use("/api/boards", boardRoutes);

/**
 * =========================
 * 404
 * =========================
 */
app.use((req, res) => {
  return res.status(404).json({
    error: "Route not found",
  });
});

/**
 * =========================
 * GLOBAL ERROR HANDLER
 * =========================
 */
app.use((err, req, res, next) => {
  console.error(err);

  return res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
  });
});

module.exports = app;
