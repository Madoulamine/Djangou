const { Server } = require("socket.io");
const socketAuthMiddleware = require("../middleware/socketAuthMiddleware");
const quizSocketHandler = require("../sockets/quiz.socket");
const evaluationSocketHandler = require("../sockets/evaluation.socket");

function getAllowedOrigins() {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return clientUrl.split(",").map((origin) => origin.trim());
}

/**
 * Structure de données pour suivre les utilisateurs en ligne.
 * Clé : ID de l'utilisateur (Firestore ID)
 * Valeur : Set contenant les ID des sockets (Set au cas où un utilisateur a plusieurs onglets ouverts)
 */
const connectedUsers = new Map();

// Initialise Socket.IO sur le serveur HTTP Express.
function initializeSocket(server, app) {
  const io = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
    // Ping/Pong config for stable connections
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Application du middleware de sécurité AVANT d'établir la connexion
  io.use(socketAuthMiddleware);

  if (app) {
    // Permet d'utiliser l'objet io directement dans les contrôleurs (req.app.get('io'))
    app.set("io", io);
  }

  // Écoute des nouvelles connexions entrantes (qui ont passé l'authentification)
  io.on("connection", (socket) => {
    const user = socket.user;

    // Ajout et gestion de l'état "en ligne"
    if (!connectedUsers.has(user.id)) {
      connectedUsers.set(user.id, new Set());
    }
    connectedUsers.get(user.id).add(socket.id);

    // L'utilisateur rejoint une "Room" nommée avec son ID.
    // Très utile : on pourra envoyer des notifications ou des msgs ciblés
    // io.to(`user_${user.id}`).emit('notification', {...})
    socket.join(`user_${user.id}`);

    console.log(`[Socket 🟢] Connecté : ${user.prenom} ${user.nom} (${user.role}) - ID Socket: ${socket.id}`);

    // Initialisation des modules Socket selon les fonctionnalités
    quizSocketHandler(io, socket);
    evaluationSocketHandler(io, socket);

    // Optionnel: Diffuser l'information aux autres membres (à adapter selon le besoin métier)
    // socket.broadcast.emit("userPresenceChange", { userId: user.id, online: true });

    // Gestion de la déconnexion
    socket.on("disconnect", () => {
      // Nettoyage de l'état "en ligne"
      const userSockets = connectedUsers.get(user.id);
      if (userSockets) {
        userSockets.delete(socket.id);
        // Si plus aucun appareil/onglet n'est connecté pour cet utilisateur
        if (userSockets.size === 0) {
          connectedUsers.delete(user.id);
          // socket.broadcast.emit("userPresenceChange", { userId: user.id, online: false });
        }
      }

      console.log(`[Socket 🔴] Déconnecté : ${user.prenom} ${user.nom}`);
    });

    // Écoute globale des erreurs internes au socket
    socket.on("error", (err) => {
      console.error(`[Socket ⚠️] Erreur (Socket ${socket.id}):`, err);
    });
  });

  return io;
}

module.exports = {
  initializeSocket,
  connectedUsers,
};
