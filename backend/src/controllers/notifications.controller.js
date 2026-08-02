// src/controllers/notifications.controller.js
// Contrôleur pour gérer les souscriptions Web Push 

const { COLLECTIONS, updateDocument, getDocumentById } = require("../services/firebase.service");
const { publicKey } = require("../config/webpush");

/**
 * GET /api/notifications/vapid-public-key
 * Renvoie la clé publique VAPID pour que le frontend puisse s'y abonner de manière sécurisée.
 */
async function getVapidPublicKey(req, res, next) {
    try {
        res.status(200).json({ success: true, publicKey });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/notifications/subscribe
 * Enregistre ou met à jour la souscription Push de l'appareil de l'utilisateur.
 * Corps attendu : { subscription: Object } 
 */
async function subscribe(req, res, next) {
    try {
        const { subscription } = req.body;

        if (!subscription || !subscription.endpoint) {
            const err = new Error("Objet de souscription invalide.");
            err.statusCode = 400; throw err;
        }

        const user = await getDocumentById(COLLECTIONS.USERS, req.user.id);

        // On stocke la souscription dans un tableau pour supporter plusieurs appareils (Téléphone + PC)
        const currentSubscriptions = user.pushSubscriptions || [];

        // Dé-duplication basée sur l'endpoint
        const filtered = currentSubscriptions.filter(s => s.endpoint !== subscription.endpoint);
        filtered.push(subscription);

        await updateDocument(COLLECTIONS.USERS, req.user.id, { pushSubscriptions: filtered });

        res.status(201).json({ success: true, message: "Appareil abonné aux notifications." });
    } catch (error) {
        next(error);
    }
}

module.exports = { getVapidPublicKey, subscribe };
