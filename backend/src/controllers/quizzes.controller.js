// src/controllers/quizzes.controller.js
// Gère le cycle de vie complet d'un quiz solo : création, lecture, modification, suppression et soumission des réponses

const { validationResult } = require("express-validator");
const {
    COLLECTIONS,
    createDocument,
    getDocumentById,
    updateDocument,
    deleteDocument,
    listDocuments,
} = require("../services/firebase.service");
const { db } = require("../config/firebase");
const { calculateScore } = require("../services/scoring.service");
const { checkAndAwardSoloBadge } = require("../services/badges.service");
const { updateUserStats } = require("../services/leaderboard.service");

/**
 * Crée un nouveau quiz.
 * Seul un ENSEIGNANT ou un ADMIN peut créer un quiz.
 * Le quiz contient un timer, des questions (QCM ou réponses libres), et un niveau scolaire.
 */
async function createQuiz(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error("Erreur de validation");
            error.statusCode = 400;
            error.errors = errors.array();
            throw error;
        }

        const { title, description, subject, level, difficulty, questionTimer, questions, isPublished } = req.body;

        if (difficulty === "DIFFICILE" && (!questionTimer || questionTimer < 5)) {
            const err = new Error("Un quiz de difficulté 'DIFFICILE' doit avoir un timer par question (au moins 5 secondes).");
            err.statusCode = 400;
            throw err;
        }

        // Valider que les questions sont bien un tableau non vide
        if (!Array.isArray(questions) || questions.length === 0) {
            const err = new Error("Un quiz doit contenir au moins une question.");
            err.statusCode = 400;
            throw err;
        }

        const newQuiz = {
            title,
            description: description || "",
            subject: subject || "Non spécifié",
            level: level || "PRIMAIRE",
            difficulty: difficulty || "FACILE",             // FACILE | MOYEN | DIFFICILE
            questionTimer: difficulty === "DIFFICILE" ? Number(questionTimer) : null,
            questions,                                      // Tableau de questions avec id, type, question, options, answer, points
            teacherId: req.user.id,
            teacherEmail: req.user.email,
            isPublished: isPublished === true || isPublished === "true",
            playCount: 0,                                   // Nombre de fois que le quiz a été joué
        };

        // Si le frontend PWA génère l'ID hors-ligne, on l'utilise (idempotence)
        const quizId = req.body.id || null;
        const created = await createDocument(COLLECTIONS.QUIZZES, newQuiz, quizId);

        res.status(201).json({
            success: true,
            data: created,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Récupère la liste des quiz avec pagination et filtres.
 * Les ELEVE ne voient que les quiz publiés.
 * Filtres disponibles : subject, level.
 */
async function getQuizzes(req, res, next) {
    try {
        const { subject, level, startAfterId } = req.query;
        const limit = Math.min(Number(req.query.limit) || 50, 100);

        let filters = [];

        // Un élève ne peut voir que les quiz publiés
        if (req.user.role === "ELEVE") {
            filters.push(["isPublished", "==", true]);
        }

        if (subject) {
            filters.push(["subject", "==", subject]);
        }

        if (level) {
            filters.push(["level", "==", level.toUpperCase()]);
        }

        let startAfterDoc = null;
        if (startAfterId) {
            const docSnap = await db.collection(COLLECTIONS.QUIZZES).doc(startAfterId).get();
            if (docSnap.exists) {
                startAfterDoc = docSnap;
            }
        }

        const result = await listDocuments(COLLECTIONS.QUIZZES, {
            filters,
            orderBy: ["createdAt", "desc"],
            limit,
            startAfterDoc,
        });

        // On n'expose pas les réponses correctes dans la liste
        const sanitized = result.docs.map(({ questions, ...quiz }) => ({
            ...quiz,
            questionCount: Array.isArray(questions) ? questions.length : 0,
        }));

        res.status(200).json({
            success: true,
            data: sanitized,
            lastDocId: result.lastDoc ? result.lastDoc.id : null,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Récupère un quiz par son ID.
 * Les réponses correctes sont masquées pour les ELEVE (pour éviter la triche côté API).
 */
async function getQuizById(req, res, next) {
    try {
        const quizId = req.params.id;
        const quiz = await getDocumentById(COLLECTIONS.QUIZZES, quizId);

        if (!quiz) {
            const err = new Error("Quiz introuvable.");
            err.statusCode = 404;
            throw err;
        }

        // Un élève ne peut pas voir un quiz non publié
        if (!quiz.isPublished && req.user.role === "ELEVE") {
            const err = new Error("Accès refusé. Ce quiz n'est pas encore publié.");
            err.statusCode = 403;
            throw err;
        }

        // Masquer les réponses correctes pour les élèves
        let responseData = { ...quiz };
        if (req.user.role === "ELEVE") {
            responseData.questions = (quiz.questions || []).map(({ answer, ...q }) => q);
        }

        // Incrémenter le compteur de parties en arrière-plan
        updateDocument(COLLECTIONS.QUIZZES, quizId, { playCount: (quiz.playCount || 0) + 1 }).catch(() => { });

        res.status(200).json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Modifie un quiz existant.
 * Seul le propriétaire (ENSEIGNANT) ou un ADMIN peut modifier un quiz.
 */
async function updateQuiz(req, res, next) {
    try {
        const quizId = req.params.id;
        const quiz = await getDocumentById(COLLECTIONS.QUIZZES, quizId);

        if (!quiz) {
            const err = new Error("Quiz introuvable.");
            err.statusCode = 404;
            throw err;
        }

        // Vérification propriétaire ou admin
        if (quiz.teacherId !== req.user.id && req.user.role !== "ADMIN") {
            const err = new Error("Action non autorisée. Vous ne pouvez modifier que vos propres quiz.");
            err.statusCode = 403;
            throw err;
        }

        const { title, description, subject, level, difficulty, questionTimer, questions, isPublished } = req.body;

        const payload = {};
        if (title !== undefined) payload.title = title;
        if (description !== undefined) payload.description = description;
        if (subject !== undefined) payload.subject = subject;
        if (level !== undefined) payload.level = level.toUpperCase();
        if (difficulty !== undefined) payload.difficulty = difficulty.toUpperCase();

        // Validation du timer si on change la difficulté ou le timer lui-même
        const finalDifficulty = payload.difficulty || quiz.difficulty;
        const finalTimer = questionTimer !== undefined ? questionTimer : quiz.questionTimer;

        if (finalDifficulty === "DIFFICILE") {
            if (!finalTimer || finalTimer < 5) {
                const err = new Error("Un quiz de difficulté 'DIFFICILE' doit avoir un timer par question (au moins 5 secondes).");
                err.statusCode = 400;
                throw err;
            }
            payload.questionTimer = Number(finalTimer);
        } else {
            // Pas de timer pour FACILE et MOYEN
            payload.questionTimer = null;
        }
        if (questions !== undefined) {
            if (!Array.isArray(questions) || questions.length === 0) {
                const err = new Error("Un quiz doit contenir au moins une question.");
                err.statusCode = 400;
                throw err;
            }
            payload.questions = questions;
        }
        if (isPublished !== undefined) {
            payload.isPublished = isPublished === true || isPublished === "true";
        }

        const updated = await updateDocument(COLLECTIONS.QUIZZES, quizId, payload);

        res.status(200).json({
            success: true,
            data: updated,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Supprime un quiz.
 * Seul le propriétaire (ENSEIGNANT) ou un ADMIN peut supprimer.
 */
async function deleteQuiz(req, res, next) {
    try {
        const quizId = req.params.id;
        const quiz = await getDocumentById(COLLECTIONS.QUIZZES, quizId);

        if (!quiz) {
            const err = new Error("Quiz introuvable.");
            err.statusCode = 404;
            throw err;
        }

        if (quiz.teacherId !== req.user.id && req.user.role !== "ADMIN") {
            const err = new Error("Action non autorisée. Vous ne pouvez supprimer que vos propres quiz.");
            err.statusCode = 403;
            throw err;
        }

        await deleteDocument(COLLECTIONS.QUIZZES, quizId);

        res.status(200).json({
            success: true,
            message: "Quiz supprimé avec succès.",
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Soumet les réponses d'un élève à un quiz et calcule le score automatiquement.
 * Enregistre le résultat dans la collection quizResults (Firestore).
 *
 * Body attendu :
 *   {
 *     answers: [ { questionId: "q1", answer: "Paris" }, ... ],
 *     timeSpent: 320   // secondes passées
 *   }
 */
async function submitQuizAnswers(req, res, next) {
    try {
        const quizId = req.params.id;
        const { answers, timeSpent } = req.body;

        if (!Array.isArray(answers)) {
            const err = new Error("Le champ 'answers' doit être un tableau.");
            err.statusCode = 400;
            throw err;
        }

        // Récupérer le quiz complet (avec les bonnes réponses) pour correction
        const quiz = await getDocumentById(COLLECTIONS.QUIZZES, quizId);

        if (!quiz) {
            const err = new Error("Quiz introuvable.");
            err.statusCode = 404;
            throw err;
        }

        if (!quiz.isPublished) {
            const err = new Error("Ce quiz n'est pas encore disponible.");
            err.statusCode = 403;
            throw err;
        }

        // Calculer le score via le service de scoring
        const result = calculateScore(quiz.questions || [], answers, quiz.level);

        // Sauvegarder le résultat dans la collection quizResults
        const quizResult = {
            quizId,
            quizTitle: quiz.title,
            studentId: req.user.id,
            studentEmail: req.user.email,
            score: result.score,
            maxScore: result.maxScore,
            scale: result.scale,
            totalCorrect: result.totalCorrect,
            totalQuestions: result.totalQuestions,
            timeSpent: Number(timeSpent) || 0,
            details: result.details,
            mode: "SOLO",   // distingue du mode multijoueur (Module 2 étape 11)
        };

        // Accepte un ID généré par le frontend pour la reprise après déconnexion
        const syncId = req.body.id || null;
        const saved = await createDocument(COLLECTIONS.QUIZ_RESULTS, quizResult, syncId);

        // ── Trigger badge solo (fire-and-forget) ──────────────────────────────
        // On tente l'attribution uniquement si le quiz est parfait (0 faute).
        // L'appel ne doit JAMAIS retarder ni planter la réponse HTTP.
        if (result.totalCorrect === result.totalQuestions && result.totalQuestions > 0) {
            const studentName = `${req.user.prenom || ""} ${req.user.nom || ""}`.trim();
            checkAndAwardSoloBadge(req.user.id, studentName).catch((err) => {
                console.error("[BADGE] Erreur trigger solo:", err.message);
            });
        }

        // ── Trigger Leaderboard (fire-and-forget) ──────────────────────
        updateUserStats(req.user.id, {
            quizScore: result.score,
            quizCompleted: 1
        }).catch((err) => console.error("[LEADERBOARD] Erreur d'incrémentation:", err.message));

        res.status(201).json({
            success: true,
            data: {
                resultId: saved.id,
                score: result.score,
                maxScore: result.maxScore,
                scale: result.scale,
                totalCorrect: result.totalCorrect,
                totalQuestions: result.totalQuestions,
                details: result.details,
            },
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createQuiz,
    getQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    submitQuizAnswers,
};
