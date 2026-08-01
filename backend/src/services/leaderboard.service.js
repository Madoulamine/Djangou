// src/services/leaderboard.service.js
// Service de classement optimisé (Étape 18)
// Utilise un système de dénormalisation (stats dans users) pour le leaderboard global.

const { db, FieldValue } = require("../config/firebase");
const { COLLECTIONS } = require("./firebase.service");

/**
 * Met à jour les statistiques globales d'un utilisateur de manière atomique.
 * Appelé de manière asynchrone lors de la réussite d'un quiz ou d'un défi.
 * 
 * @param {string} userId 
 * @param {object} deltas - { quizScore, defiScore, defiWon, quizCompleted }
 */
async function updateUserStats(userId, deltas = {}) {
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);

    const quizScore = deltas.quizScore || 0;
    const defiScore = deltas.defiScore || 0;
    const totalScore = quizScore + defiScore;

    const updates = {};
    if (quizScore > 0) updates["stats.quizScore"] = FieldValue.increment(quizScore);
    if (defiScore > 0) updates["stats.defiScore"] = FieldValue.increment(defiScore);
    if (totalScore > 0) updates["stats.totalScore"] = FieldValue.increment(totalScore);
    if (deltas.defiWon) updates["stats.defiWon"] = FieldValue.increment(deltas.defiWon);
    if (deltas.quizCompleted) updates["stats.quizCompleted"] = FieldValue.increment(deltas.quizCompleted);

    if (Object.keys(updates).length > 0) {
        await userRef.set(updates, { merge: true });
    }
}

/**
 * Récupère le classement global avec filtrage.
 * Exclut les PROFESSEURS et ADMINS du classement.
 */
async function getGlobalLeaderboard(filter = "global", limit = 50) {
    let orderByField = "stats.totalScore";
    if (filter === "quiz") orderByField = "stats.quizScore";
    if (filter === "defi") orderByField = "stats.defiWon";

    // Firestore nécessite un index composé (role ASC, stats.xxx DESC)
    // Pour simplifier et garantir la vitesse, le tri principal se fait sur orderByField.
    // Les enseignants et admins n'ont normalement pas de statistiques.
    const snap = await db.collection(COLLECTIONS.USERS)
        .where("role", "==", "ELEVE")
        .orderBy(orderByField, "desc")
        .limit(Number(limit))
        .get();

    return snap.docs.map((doc, index) => {
        const data = doc.data();
        return {
            rank: index + 1,
            userId: doc.id,
            name: `${data.prenom || ""} ${data.nom || ""}`.trim(),
            avatar: data.avatar || null,
            stats: data.stats || { totalScore: 0, quizScore: 0, defiScore: 0, defiWon: 0, quizCompleted: 0 }
        };
    });
}

/**
 * Récupère le classement strictement privé d'une évaluation.
 */
async function getEvaluationRanking(evalId, user) {
    // Seul le professeur créateur ou un élève inscrit évalué peut voir
    const evalDoc = await db.collection(COLLECTIONS.EVALUATIONS).doc(evalId).get();

    if (!evalDoc.exists) {
        const err = new Error("Évaluation introuvable.");
        err.statusCode = 404; throw err;
    }

    const evaluation = evalDoc.data();

    if (user.role === "ENSEIGNANT" && evaluation.teacherId !== user.id) {
        const err = new Error("Seul le créateur de l'évaluation a accès au classement.");
        err.statusCode = 403; throw err;
    }

    // Récupère les résulats triés
    const snap = await db.collection(COLLECTIONS.EVAL_RESULTS)
        .where("evalId", "==", evalId)
        .orderBy("score", "desc")
        .get();

    const ranking = snap.docs.map((doc, index) => ({
        rank: index + 1,
        id: doc.id,
        ...doc.data()
    }));

    // Si l'utilisateur est un ELEVE, on vérifie qu'il fait partie des participants
    if (user.role === "ELEVE") {
        const hasParticipated = ranking.some(r => r.studentId === user.id);
        if (!hasParticipated) {
            const err = new Error("Vous n'avez pas participé à cette évaluation.");
            err.statusCode = 403; throw err;
        }
    }

    return ranking;
}

module.exports = {
    updateUserStats,
    getGlobalLeaderboard,
    getEvaluationRanking
};
