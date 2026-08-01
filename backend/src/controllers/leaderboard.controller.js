// src/controllers/leaderboard.controller.js
// Contrôleur pour les classements

const { getGlobalLeaderboard, getEvaluationRanking } = require("../services/leaderboard.service");

/**
 * GET /api/leaderboard
 * Classement global des élèves. Supporte le filtrage.
 * Ex: ?filter=global (défaut), ?filter=quiz, ?filter=defi
 */
async function getGlobalRankings(req, res, next) {
    try {
        const { filter, limit } = req.query;
        // On sécurise et on pagine
        const maxLimit = Math.min(Number(limit) || 50, 100);

        const ranking = await getGlobalLeaderboard(filter, maxLimit);

        res.status(200).json({
            success: true,
            filter: filter || "global",
            count: ranking.length,
            data: ranking
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/leaderboard/evaluations/:evalId
 * Classement restreint d'une évaluation spécifique.
 */
async function getEvaluationRankings(req, res, next) {
    try {
        const { evalId } = req.params;

        const ranking = await getEvaluationRanking(evalId, req.user);

        res.status(200).json({
            success: true,
            evalId,
            count: ranking.length,
            data: ranking
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getGlobalRankings,
    getEvaluationRankings
};
