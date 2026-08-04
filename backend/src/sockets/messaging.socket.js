// src/sockets/messaging.socket.js
// Gère les événements WebSocket pour la messagerie privée (Module 3 — Étape 16)
//
// Architecture : dès qu'un utilisateur se connecte, il rejoint automatiquement
// sa "room personnelle" (room_user_<id>). Cela permet au serveur de lui émettre
// un message en temps réel même si la conversation est ouverte dans un autre onglet.
//
// Événements entrants (client → serveur) :
//   msg:send              — Envoyer un message dans une conversation ACTIVE
//   msg:mark_read         — Marquer les messages d'une conversation comme lus
//   msg:typing            — Notifier que l'utilisateur est en train de taper
//
// Événements sortants (serveur → client) :
//   msg:new               — Réception d'un nouveau message en direct
//   msg:read              — Confirmation que les messages ont été lus par l'autre
//   msg:typing            — L'autre participant est en train de taper

const {
    saveMessage,
    markMessagesAsRead,
    getDocumentById,
} = require("../services/messaging.service");
const { COLLECTIONS } = require("../services/firebase.service");

module.exports = (io, socket) => {
    const user = socket.user;

    // Rejoindre la room personnelle (réception de messages même sans la conv ouverte)
    socket.join(`room_user_${user.id}`);

    /**
     * Envoi d'un message dans une conversation existante et ACTIVE.
     * Le room Socket.IO de la conversation sert à notifier les deux participants.
     *
     * input: { conversationId: "abc123", text: "Bonjour !" }
     */
    socket.on("msg:send", async (data, callback) => {
        try {
            const { conversationId, text } = data;

            if (!conversationId || !text) {
                return callback && callback({ success: false, error: "conversationId et text sont requis." });
            }

            // Persister le message en base de données (validation incluse)
            const message = await saveMessage(conversationId, user, text);

            // Récupérer la conversation pour connaître l'autre participant
            const conversation = await getDocumentById(COLLECTIONS.CONVERSATIONS, conversationId);
            const recipientId = (conversation.participantsIds || []).find(
                (id) => id !== user.id
            );

            // Émettre le message en temps réel vers la room personnelle du destinataire
            if (recipientId) {
                io.to(`room_user_${recipientId}`).emit("msg:new", {
                    conversationId,
                    message,
                });
            }

            // Confirmer la réception à l'expéditeur
            if (typeof callback === "function") {
                callback({ success: true, message });
            }
        } catch (error) {
            console.error("[MSG:SEND] Erreur:", error.message);
            if (typeof callback === "function") {
                callback({ success: false, error: error.message });
            }
        }
    });

    /**
     * Marquer les messages d'une conversation comme lus.
     * Notifie l'expéditeur original que ses messages ont été lus (double check ✓✓).
     *
     * input: { conversationId: "abc123" }
     */
    socket.on("msg:mark_read", async (data, callback) => {
        try {
            const { conversationId } = data;
            if (!conversationId) return;

            await markMessagesAsRead(conversationId, user.id);

            // Notifier l'autre participant que ses messages sont lus
            const conversation = await getDocumentById(COLLECTIONS.CONVERSATIONS, conversationId);
            const senderId = (conversation.participantsIds || []).find(
                (id) => id !== user.id
            );
            if (senderId) {
                io.to(`room_user_${senderId}`).emit("msg:read", { conversationId });
            }

            if (typeof callback === "function") callback({ success: true });
        } catch (error) {
            console.error("[MSG:MARK_READ] Erreur:", error.message);
            if (typeof callback === "function") callback({ success: false, error: error.message });
        }
    });

    /**
     * Notification de frappe en cours ("est en train d'écrire…").
     * Purement Socket.IO, pas de persistance en base.
     *
     * input: { conversationId: "abc123", recipientId: "userId" }
     */
    socket.on("msg:typing", (data) => {
        const { recipientId, conversationId } = data;
        if (!recipientId || !conversationId) return;

        io.to(`room_user_${recipientId}`).emit("msg:typing", {
            conversationId,
            from: {
                id: user.id,
                name: `${user.prenom} ${user.nom}`,
            },
        });
    });
};
