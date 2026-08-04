// src/services/notification.service.js
// Service centralisé de gestion des notifications.
// Protégé par un Regroupement (Debouncing) pour l'anti-triche et
// connecté à Firebase, Socket.IO, et PWA Web Push (VAPID).

const { COLLECTIONS, createDocument, getDocumentById } = require("./firebase.service");
const { webpush } = require("../config/webpush");

// File d'attente (Set) pour le debounce des alertes de triche
const cheatAlertsQueue = new Set();
let cheatDebounceTimer = null;

/**
 * Lance l'envoi groupé des alertes de triche aux professeurs (toutes les X secondes).
 */
function flushCheatAlerts(io) {
    const fraudCount = cheatAlertsQueue.size;

    if (fraudCount === 0 || !io) return;

    // Envoi silencieux mais tracé au niveau du dashboard enseignant.
    const message = fraudCount === 1
        ? "⚠️ 1 élève a été détecté en train de frauder à l'instant."
        : `🚨 ${fraudCount} élèves ont été suspectés de triche à l'instant.`;

    io.to("ROLE_ENSEIGNANT").emit("notification:new", {
        type: "CHEAT_ALERT_BATCH",
        title: "Tentatives de triche bloquées",
        message,
        timestamp: new Date().toISOString()
    });

    console.log(`[Anti-Triche] Envoi groupé de ${fraudCount} alertes aux professeurs.`);

    // Nettoyage de la file
    cheatAlertsQueue.clear();
    cheatDebounceTimer = null;
}

/**
 * L'API de Notification Universelle
 * @param {Object} params - { userId, type, title, message, data }
 * @param {Object} [io] - L'objet socket.io serveur (optionnel).
 */
async function sendNotification({ userId, type, title, message, data = {} }, io = null) {
    if (!userId || !title) throw new Error("userId et title sont obligatoires.");

    // ---- 1. GESTION SPECIALE: ANTI-TRICHE ---- //
    // Si c'est une triche, on ajoute le cas et on lance un timer (Debouncing).
    if (type === "CHEAT_DETECTED") {
        cheatAlertsQueue.add(userId);

        // Côté frontend, le socket force la bordure rouge et l'emoji sur l'appareil de l'élève
        if (io) {
            io.to(`user_${userId}`).emit("action:cheat_penalty", { border: "red", emoji: "🤡", message });
        }

        if (!cheatDebounceTimer && io) {
            // Regroupe toutes les tentatives dans les 10 prochaines secondes.
            cheatDebounceTimer = setTimeout(() => flushCheatAlerts(io), 10000);
        }

        // On ne stocke pas un document de notification par triche pour ne pas inonder la base,
        // ou on pourrait le faire dans une log dédiée. Pour l'heure, on bloque l'exécution ici.
        return null;
    }

    // ---- 2. FLUX CLASSIQUE : DB + SOCKET ---- //
    const payload = { userId, type, title, message, data, read: false };
    const savedNotification = await createDocument(COLLECTIONS.NOTIFICATIONS, payload);

    if (io) {
        io.to(`user_${userId}`).emit("notification:new", savedNotification);
    }

    // ---- 3. WEB PUSH (Le "Facebook Style" PWA sur Chrome/Mobile) ---- //
    try {
        const user = await getDocumentById(COLLECTIONS.USERS, userId);

        if (user && Array.isArray(user.pushSubscriptions) && user.pushSubscriptions.length > 0) {
            const pushPayload = JSON.stringify({ title, body: message, icon: "/logo_djangou.png", data });

            // On envoie le push web asynchrone pour ne pas ralentir le process (fire-and-forget pour tous ses appareils)
            user.pushSubscriptions.forEach(sub => {
                webpush.sendNotification(sub, pushPayload).catch(err => {
                    // Si l'erreur est 410 (Gone) -> l'utilisateur s'est déconnecté du push, il faudrait le nettoyer.
                    if (err.statusCode === 410) {
                        console.log(`[WebPush] Souscription obsolète détectée pour ${userId}. À nettoyer.`);
                    }
                });
            });
        }
    } catch (e) {
        console.error("[WebPush] Erreur d'envoi", e.message);
    }

    return savedNotification;
}

module.exports = {
    sendNotification,
};
