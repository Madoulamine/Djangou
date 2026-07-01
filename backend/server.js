const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = require("./src/app");

const PORT = Number(process.env.PORT) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const server = http.createServer(app);

// Initialise Socket.IO; les evenements metier seront ajoutes dans les modules dedies.
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL.split(",").map((origin) => origin.trim()),
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Socket connecté: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Socket déconnecté: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Serveur Djangou lancé sur http://localhost:${PORT}`);
});
