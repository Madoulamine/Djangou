// src/routes/evaluations.routes.js
// Routes pour la gestion des évaluations numériques (Étape 12)

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
    createEvaluationValidators,
    submitEvalValidators,
} = require("../utils/validators");
const {
    createEvaluation,
    getMyEvaluations,
    getEvaluationById,
    updateEvaluation,
    deleteEvaluation,
    getEvaluationByLink,
    submitEvaluation,
    getEvaluationResults,
} = require("../controllers/evaluations.controller");

const router = express.Router();

// ─────────────────────────────────────────────────────
// Routes ENSEIGNANT / ADMIN — Gestion des évaluations
// ─────────────────────────────────────────────────────

// Lister mes évaluations
router.get("/", authMiddleware, roleMiddleware("ENSEIGNANT", "ADMIN"), getMyEvaluations);

// Créer une évaluation (génère un lien UUID sécurisé)
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ENSEIGNANT", "ADMIN"),
    createEvaluationValidators,
    createEvaluation
);

// Consulter le détail d'une évaluation (avec les réponses correctes)
router.get("/:id", authMiddleware, roleMiddleware("ENSEIGNANT", "ADMIN"), getEvaluationById);

// Modifier une évaluation
router.put("/:id", authMiddleware, roleMiddleware("ENSEIGNANT", "ADMIN"), updateEvaluation);

// Supprimer une évaluation
router.delete("/:id", authMiddleware, roleMiddleware("ENSEIGNANT", "ADMIN"), deleteEvaluation);

// Consulter les résultats de tous les élèves (tableau de bord anti-triche)
router.get("/:id/results", authMiddleware, roleMiddleware("ENSEIGNANT", "ADMIN"), getEvaluationResults);

// ─────────────────────────────────────────────────────
// Routes ÉLÈVE — Accès via le lien UUID
// ─────────────────────────────────────────────────────

// Accéder à l'évaluation via son lien unique (réponses masquées)
router.get("/join/:accessLink", authMiddleware, getEvaluationByLink);

// Soumettre les réponses (avec compteur anti-triche)
router.post(
    "/join/:accessLink/submit",
    authMiddleware,
    submitEvalValidators,
    submitEvaluation
);

module.exports = router;
