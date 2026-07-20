// src/sockets/quiz.socket.js
// Gère tous les événements WebSockets liés au module Multijoueur

const multiplayerService = require("../services/multiplayer.service");

module.exports = (io, socket) => {

    // Le joueur (user) est déjà attaché à la socket par le middleware d'auth
    const user = socket.user;

    /**
     * Lancer un défi : Création de la salle d'attente
     * input: { quizId: "XXX" }
     */
    socket.on("quiz:create_challenge", async (data, callback) => {
        try {
            const { quizId } = data;
            const room = await multiplayerService.createChallenge(user, quizId);

            socket.join(room.roomId);

            // Retourne le code de salle au créateur
            if (typeof callback === "function") {
                callback({ success: true, roomId: room.roomId });
            }
        } catch (error) {
            console.error("Erreur create_challenge:", error.message);
            if (typeof callback === "function") callback({ success: false, error: error.message });
        }
    });

    /**
     * Rejoindre un défi avec un code
     * input: { roomId: "1A2B3C" }
     */
    socket.on("quiz:join_challenge", (data, callback) => {
        try {
            const { roomId } = data;
            const room = multiplayerService.joinChallenge(roomId, user);

            socket.join(roomId);

            // Notifier les autres joueurs de la salle de l'arrivée
            socket.in(roomId).emit("quiz:player_joined", {
                name: user.prenom + " " + user.nom
            });

            if (typeof callback === "function") {
                callback({ success: true, quizTitle: room.quizTitle });
            }
        } catch (error) {
            if (typeof callback === "function") callback({ success: false, error: error.message });
        }
    });

    /**
     * Le créateur démarre le défi
     * input: { roomId: "1A2B3C" }
     */
    socket.on("quiz:start_challenge", (data, callback) => {
        try {
            const { roomId } = data;
            // Le service va commencer à émettre via 'io' directement dans la salle
            multiplayerService.startChallenge(io, roomId, user.id);
            if (typeof callback === "function") callback({ success: true });
        } catch (error) {
            if (typeof callback === "function") callback({ success: false, error: error.message });
        }
    });

    /**
     * Soumission d'une réponse à la question courante
     * input: { roomId, answer: "Paris" }
     */
    socket.on("quiz:submit_answer", (data) => {
        const { roomId, answer } = data;
        const result = multiplayerService.submitAnswer(io, roomId, user.id, answer);

        // On notifie confidentiellement l'utilisateur que sa réponse est traitée
        if (result) {
            socket.emit("quiz:answer_ack", {
                accepted: true,
                currentScore: result.currentScore
            });
        }
    });

    /**
     * ANTI-TRICHE CRITIQUE
     * Frontend PWA : S'il détecte document.hidden === true -> Envoie cet Event
     */
    socket.on("quiz:anti_cheat_violation", (data) => {
        const { roomId } = data;
        if (roomId) {
            multiplayerService.disqualifyPlayer(io, roomId, user.id);
        }
    });
};
