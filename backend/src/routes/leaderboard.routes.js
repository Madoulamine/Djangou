// src/routes/leaderboard.routes.js
// Routes pour les différents classements.

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getGlobalRankings, getEvaluationRankings } = require("../controllers/leaderboard.controller");

const router = express.Router();

// Classement global : accessible à tous les utilisateurs authentifiés
router.get("/", authMiddleware, getGlobalRankings);

// Classement hybride évaluation : protégé au niveau service
router.get("/evaluations/:evalId", authMiddleware, getEvaluationRankings);

module.exports = router;
