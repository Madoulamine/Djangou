// src/controllers/messaging.controller.js
// Routes HTTP pour la messagerie privée — gestion des conversations et modération
// (Module 3 — Étape 16)
//
// La partie temps-réel (envoi/réception de messages) est gérée dans messaging.socket.js
// Les routes HTTP couvrent :
//   - Création/récupération d'une conversation
//   - Lecture de l'historique des messages
//   - Réponse (accepter / refuser) à une demande de conversation
//   - Blocage d'un utilisateur
//   - Signalement d'une conversation

const {
    getOrCreateConversation,
    getUserConversations,
    respondToConversationRequest,
    getConversationHistory,
    blockUser,
    reportConversation,
    markMessagesAsRead,
} = require("../services/messaging.service");

/**
 * POST /api/messages/conversations
 * Corps : { recipientId }
 * Crée ou retourne la conversation entre l'utilisateur connecté et le destinataire.
 * La règle de contexte partagé est vérifiée dans le service.
 */
async function startConversation(req, res, next) {
    try {
        const { recipientId } = req.body;
        if (!recipientId) {
            const err = new Error("Le champ recipientId est requis.");
            err.statusCode = 400;
            throw err;
        }

        if (recipientId === req.user.id) {
            const err = new Error("Vous ne pouvez pas démarrer une conversation avec vous-même.");
            err.statusCode = 400;
            throw err;
        }

        const conversation = await getOrCreateConversation(req.user, recipientId);
        res.status(200).json({ success: true, data: conversation });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/messages/conversations
 * Retourne toutes les conversations de l'utilisateur connecté.
 */
async function listConversations(req, res, next) {
    try {
        const conversations = await getUserConversations(req.user.id);
        res.status(200).json({ success: true, count: conversations.length, data: conversations });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/messages/conversations/:conversationId/respond
 * Corps : { decision: "ACTIVE" | "REJECTED" }
 * Permet au destinataire d'accepter ou de refuser une demande de conversation.
 */
async function respondToRequest(req, res, next) {
    try {
        const { conversationId } = req.params;
        const { decision } = req.body;

        const updated = await respondToConversationRequest(
            conversationId,
            req.user.id,
            decision
        );
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/messages/conversations/:conversationId/history
 * Retourne l'historique paginé des messages d'une conversation.
 * Query param : ?limit=30
 */
async function getHistory(req, res, next) {
    try {
        const { conversationId } = req.params;
        const limit = parseInt(req.query.limit) || 30;

        const messages = await getConversationHistory(conversationId, req.user.id, limit);
        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/messages/conversations/:conversationId/read
 * Marque les messages non-lus comme lus pour l'utilisateur connecté.
 */
async function readMessages(req, res, next) {
    try {
        await markMessagesAsRead(req.params.conversationId, req.user.id);
        res.status(200).json({ success: true });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/messages/block
 * Corps : { targetId }
 * Bloque un utilisateur.
 */
async function block(req, res, next) {
    try {
        const { targetId } = req.body;
        if (!targetId) {
            const err = new Error("Le champ targetId est requis.");
            err.statusCode = 400;
            throw err;
        }

        await blockUser(req.user.id, targetId);
        res.status(200).json({ success: true, message: "Utilisateur bloqué avec succès." });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/messages/conversations/:conversationId/report
 * Corps : { reason }
 * Signale une conversation à l'administration.
 */
async function report(req, res, next) {
    try {
        const { conversationId } = req.params;
        const { reason } = req.body;

        const filed = await reportConversation(conversationId, req.user.id, reason);
        res.status(201).json({
            success: true,
            message: "Signalement envoyé à l'administration.",
            data: filed,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    startConversation,
    listConversations,
    respondToRequest,
    getHistory,
    readMessages,
    block,
    report,
};
