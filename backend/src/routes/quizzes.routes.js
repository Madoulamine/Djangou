// src/routes/quizzes.routes.js
// Définit toutes les routes pour la gestion des quiz solo (Module 2 — Étape 10)

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    createQuizValidators,
    submitAnswersValidators,
} = require("../utils/validators");
const {
    createQuiz,
    getQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    submitQuizAnswers,
} = require("../controllers/quizzes.controller");

const router = express.Router();

// Récupérer la liste des quiz (filtrés par rôle dans le contrôleur)
router.get("/", authMiddleware, getQuizzes);

// Consulter un quiz précis (les réponses correctes sont masquées pour les ELEVE)
router.get("/:id", authMiddleware, getQuizById);

// Créer un nouveau quiz — ENSEIGNANT ou ADMIN uniquement
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ENSEIGNANT", "ADMIN"),
    createQuizValidators,
    createQuiz
);

// Modifier un quiz — ENSEIGNANT (propriétaire) ou ADMIN uniquement
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ENSEIGNANT", "ADMIN"),
    updateQuiz
);

// Supprimer un quiz — ENSEIGNANT (propriétaire) ou ADMIN uniquement
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ENSEIGNANT", "ADMIN"),
    deleteQuiz
);

// Soumettre les réponses d'un quiz et recevoir le score — ELEVE (ou tout rôle connecté)
router.post(
    "/:id/submit",
    authMiddleware,
    submitAnswersValidators,
    submitQuizAnswers
);

module.exports = router;
