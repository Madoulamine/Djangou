// src/routes/badges.routes.js
// Routes pour la lecture des badges automatiques (Module 3 — Étape 14)
//
// GET /api/badges             → badges de l'utilisateur connecté (tous rôles)
// GET /api/badges/:userId     → badges d'un élève précis (ENSEIGNANT + ADMIN uniquement)

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { getUserBadges } = require("../controllers/badges.controller");

const router = express.Router();

// Récupérer ses propres badges — tout utilisateur connecté
router.get("/", authMiddleware, getUserBadges);

// Consulter les badges d'un autre élève — ENSEIGNANT ou ADMIN uniquement
// (la vérification des droits ELEVE est double-checkée aussi dans le contrôleur)
router.get(
    "/:userId",
    authMiddleware,
    roleMiddleware("ENSEIGNANT", "ADMIN"),
    getUserBadges
);

module.exports = router;
