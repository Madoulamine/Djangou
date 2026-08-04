/**
 * @fileoverview Gestionnaire Socket.IO pour la Supervision WebRTC et l'Anti-Triche.
 * Ce module sert de serveur de signalisation (Signaling Server) pour établir 
 * les connexions vidéo P2P entre enseignants et étudiants, et relaie les alertes.
 */
const { db, FieldValue } = require("../config/firebase");

module.exports = function (io, socket) {
    const user = socket.user; // L'utilisateur authentifié (Middlewares Socket)

    /**
     * 1. REJOINDRE LA SALLE DE SUPERVISION
     * Le professeur comme l'élève doivent rejoindre la salle d'évaluation.
     */
    socket.on("supervision:join", ({ evaluationId }) => {
        if (!evaluationId) return;
        const roomName = `supervision_eval_${evaluationId}`;
        socket.join(roomName);

        // Si on est élève, on signale sa présence au professeur
        if (user.role === "ELEVE" || user.role === "ETUDIANT") {
            // Notifier la salle (donc le prof) de l'arrivée de l'élève
            socket.to(roomName).emit("supervision:student_joined", {
                userId: user.id,
                nom: user.nom,
                prenom: user.prenom,
                status: "online"
            });
        }
    });

    /**
     * 2. SIGNALISATION WEBRTC (OFFER / ANSWER / ICE)
     * Le flux vidéo ne passe pas par le serveur. Le serveur relaie juste les clés de chiffrement (SDP).
     */

    // Une partie (Prof ou Elève) envoie une offre WebRTC
    socket.on("supervision:webrtc_offer", ({ targetUserId, sdp }) => {
        // Relais direct vers l'utilisateur cible, en utilisant sa room personnelle 'user_{id}'
        socket.to(`user_${targetUserId}`).emit("supervision:webrtc_offer_received", {
            senderUserId: user.id,
            sdp
        });
    });

    // La partie adverse répond avec une answer WebRTC
    socket.on("supervision:webrtc_answer", ({ targetUserId, sdp }) => {
        socket.to(`user_${targetUserId}`).emit("supervision:webrtc_answer_received", {
            senderUserId: user.id,
            sdp
        });
    });

    // Échange des paquets réseaux ICE (pour traverser les NATs/Pare-feux)
    socket.on("supervision:webrtc_ice_candidate", ({ targetUserId, candidate }) => {
        socket.to(`user_${targetUserId}`).emit("supervision:webrtc_ice_candidate_received", {
            senderUserId: user.id,
            candidate
        });
    });


    /**
     * 3. SNAPSHOT FALLBACK (POUR LES MAUVAISES CONNEXIONS)
     * Si le WebRTC échoue, l’élève envoie une photo de sa webcam toutes les X secondes.
     */
    socket.on("supervision:snapshot", ({ evaluationId, imageBase64 }) => {
        // Seul le professeur (dans son dashboard) a besoin de recevoir cette frame
        const roomName = `supervision_eval_${evaluationId}`;
        socket.to(roomName).emit("supervision:snapshot_received", {
            userId: user.id,
            imageBase64,
            timestamp: Date.now()
        });
    });


    /**
     * 4. SYSTÈME ANTI-TRICHE : DÉTECTION DU FOCUS ET CHANGEMENT D'ONGLET
     */

    // L'élève navigue hors de l'application
    socket.on("supervision:focus_lost", async ({ evaluationId }) => {
        const roomName = `supervision_eval_${evaluationId}`;
        console.log(`⚠️ ALERTE TRICHE : L'élève ${user.nom} a quitté l'examen (Eval: ${evaluationId})`);

        // 1. Sauvegarde persistante dans Firestore (sous-collection cheatLogs)
        try {
            await db.collection("evaluations").doc(evaluationId).collection("cheatLogs").add({
                userId: user.id,
                nom: user.nom,
                prenom: user.prenom,
                type: "FOCUS_LOST",
                message: "L'étudiant a quitté l'onglet de l'examen.",
                userAgent: socket.handshake.headers['user-agent'] || 'Inconnu',
                createdAt: FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error("Erreur lors de l'enregistrement du log de triche (Firestore) :", error);
        }

        // 2. Alerte le professeur en temps réel
        socket.to(roomName).emit("supervision:alert_focus_lost", {
            userId: user.id,
            nom: user.nom,
            prenom: user.prenom,
            timestamp: Date.now(),
            message: "L'étudiant a quitté l'onglet de l'examen."
        });
    });

    // L'élève revient sur l'application
    socket.on("supervision:focus_restored", ({ evaluationId }) => {
        const roomName = `supervision_eval_${evaluationId}`;
        console.log(`✅ L'élève ${user.nom} est revenu sur l'examen (Eval: ${evaluationId})`);

        // Le professeur est averti que l'élève est de retour
        socket.to(roomName).emit("supervision:alert_focus_restored", {
            userId: user.id,
            timestamp: Date.now()
        });
    });

    /**
     * 5. GESTION DE LA DÉCONNEXION BRUTALE
     */
    socket.on("disconnecting", () => {
        // Avertir toutes les salles de supervision auxquelles le socket appartenait
        for (const room of socket.rooms) {
            if (room.startsWith("supervision_eval_")) {
                socket.to(room).emit("supervision:student_offline", {
                    userId: user.id
                });
            }
        }
    });
};
