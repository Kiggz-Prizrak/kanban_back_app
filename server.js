require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const { normalizePort } = require("./src/utils/port");
const { initDatabase } = require("./src/models"); // 👈 AJOUT

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const server = http.createServer(app);

const start = async () => {
  try {
    await initDatabase(); // 🔥 CRÉE LES TABLES

    server.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

start();
