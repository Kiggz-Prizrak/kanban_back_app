require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const { normalizePort } = require("./src/utils/port");
// const { initSocket } = require("./src/socket"); // futur

const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

const server = http.createServer(app);

// Future feature
// initSocket(server);

server.on("error", (error) => {
  if (error.syscall !== "listen") throw error;

  switch (error.code) {
    case "EACCES":
      console.error(`❌ Port ${port} requires privileges`);
      process.exit(1);
    case "EADDRINUSE":
      console.error(`❌ Port ${port} already in use`);
      process.exit(1);
    default:
      throw error;
  }
});

server.on("listening", () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

server.listen(port);
