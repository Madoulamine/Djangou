// src/routes/defis.routes.js
// Routes pour les Défis 1v1 (Étape 17)
// Toutes les routes sont protégées par authMiddleware (ELEVE ou ENSEIGNANT)

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { challenge, play, listMyDefis } = require("../controllers/defis.controller");

const router = express.Router();

router.post("/", authMiddleware, challenge);                   // Lancer un défi
router.post("/:defiId/play", authMiddleware, play);           // Répondre (jouer ou refuser)
router.get("/", authMiddleware, listMyDefis);                  // Voir mes défis

module.exports = router;
