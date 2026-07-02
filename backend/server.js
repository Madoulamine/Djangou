const path = require("path");
const http = require("http");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = require("./src/app");
const { initializeSocket } = require("./src/config/socket");

const PORT = Number(process.env.PORT) || 5000;

const server = http.createServer(app);

initializeSocket(server, app);

server.listen(PORT, () => {
  console.log(`Serveur Djangou lancé sur http://localhost:${PORT}`);
});
