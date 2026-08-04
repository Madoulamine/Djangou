// src/controllers/badges.controller.js
// Gère la lecture des badges attribués aux élèves (Module 3 — Étape 14)
//
// Routes exposées :
//   GET /api/badges          → badges de l'utilisateur connecté
//   GET /api/badges/:userId  → badges d'un élève précis (ADMIN ou ENSEIGNANT seulement)

const { getBadgesByStudent } = require("../services/badges.service");

/**
 * Retourne les badges d'un élève.
 *
 * - Si aucun :userId dans les params → retourne les badges de l'utilisateur connecté
 * - Si :userId présent :
 *     - Un ELEVE ne peut consulter que ses propres badges → 403 si userId !== req.user.id
 *     - Un ENSEIGNANT ou ADMIN peut consulter les badges de n'importe quel élève
 */
async function getUserBadges(req, res, next) {
    try {
        // Détermine l'ID cible : celui du param ou celui du token JWT
        const targetId = req.params.userId || req.user.id;

        // Un ELEVE ne peut jamais consulter les badges d'un autre utilisateur
        if (req.user.role === "ELEVE" && targetId !== req.user.id) {
            const err = new Error("Accès refusé. Vous ne pouvez consulter que vos propres badges.");
            err.statusCode = 403;
            throw err;
        }

        const badges = await getBadgesByStudent(targetId);

        res.status(200).json({
            success: true,
            count: badges.length,
            data: badges,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { getUserBadges };
