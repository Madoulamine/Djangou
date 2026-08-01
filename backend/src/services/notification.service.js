// src/services/notification.service.js
// Service central de gestion des notifications.
// 
// Utilisé pour éviter la duplication de code à chaque fois qu'un module
// a besoin de notifier un utilisateur (Défis, Messagerie, etc.).
// Supporte l'enregistrement Firestore et le push Socket.IO temps réel.

const { COLLECTIONS, createDocument } = require("./firebase.service");

/**
 * Envoie une notification à un utilisateur.
 *
 * @param {Object} params
 * @param {string} params.userId - L'ID de l'utilisateur destinataire.
 * @param {string} params.type - Catégorie ("DEFI_RECEIVED", "DEFI_RESULT", "NEW_MESSAGE", etc.)
 * @param {string} params.title - Titre affiché sur le frontend.
 * @param {string} params.message - Corps de la notification.
 * @param {Object} [params.data] - Données additionnelles (ex: defiId).
 * @param {Object} [io] - L'objet socket.io serveur (optionnel, pour temps réel).
 */
async function sendNotification({ userId, type, title, message, data = {} }, io = null) {
    if (!userId || !title) {
        throw new Error("userId et title sont obligatoires pour notifier.");
    }

    const payload = {
        userId,
        type,
        title,
        message,
        data,
        read: false,
    };

    // 1. Sauvegarde asynchrone en base de données pour l'historique
    const savedNotification = await createDocument(COLLECTIONS.NOTIFICATIONS, payload);

    // 2. Si Socket.io est fourni, on déclenche le push temps-réel instantané.
    // L'architecture de `socket.js` force l'abonnement à `user_${userId}`.
    if (io) {
        io.to(`user_${userId}`).emit("notification:new", savedNotification);
    }

    return savedNotification;
}

module.exports = {
    sendNotification,
};
