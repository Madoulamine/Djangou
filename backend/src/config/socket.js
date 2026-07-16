const { Server } = require("socket.io");

function getAllowedOrigins() {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  return clientUrl.split(",").map((origin) => origin.trim());
}

// Initialise Socket.IO sur le serveur HTTP Express.
function initializeSocket(server, app) {
  const io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  if (app) {
    app.set("io", io);
  }

  io.on("connection", (socket) => {
    console.log(`Socket connecte: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Socket deconnecte: ${socket.id}`);
    });
  });

  return io;
}

module.exports = {
  initializeSocket,
};
