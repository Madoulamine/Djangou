// src/routes/messaging.routes.js
// Routes pour la messagerie privée (Module 3 — Étape 16)
//
// Toutes les routes nécessitent authMiddleware.
// La partie temps-réel est dans src/sockets/messaging.socket.js

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
    startConversation,
    listConversations,
    respondToRequest,
    getHistory,
    readMessages,
    block,
    report,
} = require("../controllers/messaging.controller");

const router = express.Router();

// ── Conversations ─────────────────────────────────────────
// Créer ou récupérer une conversation avec un utilisateur
router.post("/conversations", authMiddleware, startConversation);

// Lister toutes mes conversations
router.get("/conversations", authMiddleware, listConversations);

// Accepter ou refuser une demande de conversation
router.patch("/conversations/:conversationId/respond", authMiddleware, respondToRequest);

// Lire l'historique des messages
router.get("/conversations/:conversationId/history", authMiddleware, getHistory);

// Marquer les messages comme lus
router.patch("/conversations/:conversationId/read", authMiddleware, readMessages);

// ── Modération ────────────────────────────────────────────
// Bloquer un utilisateur
router.post("/block", authMiddleware, block);

// Signaler une conversation à l'admin
router.post("/conversations/:conversationId/report", authMiddleware, report);

module.exports = router;
