// src/controllers/defis.controller.js
// Routes HTTP pour les Défis 1v1 (Étape 17)
// Aucune logique métier ici : tout est délégué à defis.service.js

const { createDefi, respondToDefi, getUserDefis } = require("../services/defis.service");

/**
 * POST /api/defis
 * Lance un défi : le challenger soumet son résultat en même temps.
 * Corps : { challengedId, quizId, challengerScore, challengerTimeMs }
 */
async function challenge(req, res, next) {
    try {
        const { challengedId, quizId, challengerScore, challengerTimeMs } = req.body;

        if (!challengedId || !quizId) {
            const err = new Error("challengedId et quizId sont requis.");
            err.statusCode = 400; throw err;
        }

        const io = req.app.get("io");
        const defi = await createDefi(req.user, challengedId, quizId, challengerScore, challengerTimeMs, io);
        res.status(201).json({ success: true, data: defi });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/defis/:defiId/play
 * Répondre à un défi : l'adversaire joue.
 * Corps : { accept, challengedScore, challengedTimeMs }
 *   - accept : true (joue) / false (refuse)
 */
async function play(req, res, next) {
    try {
        const { defiId } = req.params;
        const { accept, challengedScore, challengedTimeMs } = req.body;

        const io = req.app.get("io");
        const result = await respondToDefi(defiId, req.user, accept, challengedScore, challengedTimeMs, io);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/defis
 * Tout l'historique des défis de l'utilisateur (lancés + reçus).
 */
async function listMyDefis(req, res, next) {
    try {
        const defis = await getUserDefis(req.user.id);
        res.status(200).json({ success: true, count: defis.length, data: defis });
    } catch (error) {
        next(error);
    }
}

module.exports = { challenge, play, listMyDefis };
