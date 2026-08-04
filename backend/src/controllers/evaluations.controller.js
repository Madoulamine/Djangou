// src/controllers/evaluations.controller.js
// Gère le cycle de vie complet d'une évaluation : création (avec lien UUID sécurisé),
// accès élève via lien, soumission de réponses question par question, et scoring automatique.

const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const {
    COLLECTIONS,
    createDocument,
    getDocumentById,
    updateDocument,
    deleteDocument,
    listDocuments,
    findOneByField,
} = require("../services/firebase.service");
const scoringQueue = require("../services/scoring.queue");
const { sendEvaluationInvite } = require("../services/email.service");

// ─────────────────────────────────────────────────────────────────────────────
// CRUD ENSEIGNANT / ADMIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crée une nouvelle évaluation.
 * Génère automatiquement un lien UUID unique et sécurisé partageable avec les élèves.
 * Seul un ENSEIGNANT ou un ADMIN peut créer une évaluation.
 */
async function createEvaluation(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const err = new Error("Erreur de validation");
            err.statusCode = 400;
            err.errors = errors.array();
            throw err;
        }

        const {
            title,
            description,
            subject,
            level,
            questions,
            questionTimer,
            startDate,
            endDate,
            isPublished,
            invitedEmails, // Array of strings (emails vériafiables)
        } = req.body;

        if (!Array.isArray(questions) || questions.length === 0) {
            const err = new Error("Une évaluation doit contenir au moins une question.");
            err.statusCode = 400;
            throw err;
        }

        if (!questionTimer || questionTimer < 5) {
            const err = new Error("Le timer par question doit être d'au moins 5 secondes.");
            err.statusCode = 400;
            throw err;
        }

        // Lien sécurisé UUID unique pour partager l'évaluation
        const accessLink = uuidv4();

        const newEval = {
            title,
            description: description || "",
            subject: subject || "Non spécifié",
            level: (level || "PRIMAIRE").toUpperCase(),
            questions,                       // Questions avec id, type, question, options, answer, points
            questionTimer: Number(questionTimer),
            accessLink,                      // UUID sécurisé — ex: c3b4e5f6-...
            startDate: startDate || null,    // Date/heure de début (optionnel)
            endDate: endDate || null,        // Date/heure de fin (optionnel)
            isPublished: isPublished === true || isPublished === "true",
            invitedEmails: Array.isArray(invitedEmails) ? invitedEmails : [],
            teacherId: req.user.id,
            teacherEmail: req.user.email,
            participantCount: 0,             // Nombre d'élèves qui ont soumis leurs réponses
        };

        const created = await createDocument(COLLECTIONS.EVALUATIONS, newEval);

        const shareLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/evaluation/${accessLink}`;

        // Si l'évaluation est publiée d'office et qu'il y a des invités, on envoie les emails
        if (newEval.isPublished && newEval.invitedEmails.length > 0) {
            for (const email of newEval.invitedEmails) {
                // Fire and forget, pas de await pour ne pas bloquer la requête
                sendEvaluationInvite(email, newEval.title, shareLink, newEval.startDate);
            }
        }

        res.status(201).json({
            success: true,
            data: {
                ...created,
                shareLink,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Lister les évaluations créées par l'enseignant connecté (ou toutes pour un ADMIN).
 */
async function getMyEvaluations(req, res, next) {
    try {
        const { subject, level, startAfterId } = req.query;
        const limit = Math.min(Number(req.query.limit) || 20, 100);

        const filters = [];

        // Un enseignant ne voit que ses propres évaluations, l'admin voit tout
        if (req.user.role !== "ADMIN") {
            filters.push(["teacherId", "==", req.user.id]);
        }
        if (subject) filters.push(["subject", "==", subject]);
        if (level) filters.push(["level", "==", level.toUpperCase()]);

        let startAfterDoc = null;
        if (startAfterId) {
            const snap = await db.collection(COLLECTIONS.EVALUATIONS).doc(startAfterId).get();
            if (snap.exists) startAfterDoc = snap;
        }

        const result = await listDocuments(COLLECTIONS.EVALUATIONS, {
            filters,
            orderBy: ["createdAt", "desc"],
            limit,
            startAfterDoc,
        });

        // On masque les réponses dans la liste pour alléger la réponse
        const sanitized = result.docs.map(({ questions, ...ev }) => ({
            ...ev,
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
 * Récupère le détail complet d'une évaluation (propriétaire ou admin uniquement).
 * Les bonnes réponses sont accessibles car c'est l'enseignant qui consulte.
 */
async function getEvaluationById(req, res, next) {
    try {
        const evalDoc = await getDocumentById(COLLECTIONS.EVALUATIONS, req.params.id);

        if (!evalDoc) {
            const err = new Error("Évaluation introuvable."); err.statusCode = 404; throw err;
        }

        if (evalDoc.teacherId !== req.user.id && req.user.role !== "ADMIN") {
            const err = new Error("Accès non autorisé."); err.statusCode = 403; throw err;
        }

        res.status(200).json({ success: true, data: evalDoc });
    } catch (error) {
        next(error);
    }
}

/**
 * Modifier une évaluation (propriétaire ou admin).
 */
async function updateEvaluation(req, res, next) {
    try {
        const evalDoc = await getDocumentById(COLLECTIONS.EVALUATIONS, req.params.id);
        if (!evalDoc) {
            const err = new Error("Évaluation introuvable."); err.statusCode = 404; throw err;
        }
        if (evalDoc.teacherId !== req.user.id && req.user.role !== "ADMIN") {
            const err = new Error("Action non autorisée."); err.statusCode = 403; throw err;
        }

        const { title, description, subject, level, questions, questionTimer, startDate, endDate, isPublished, invitedEmails } = req.body;

        const payload = {};
        if (title !== undefined) payload.title = title;
        if (description !== undefined) payload.description = description;
        if (subject !== undefined) payload.subject = subject;
        if (level !== undefined) payload.level = level.toUpperCase();
        if (questionTimer !== undefined) payload.questionTimer = Number(questionTimer);
        if (startDate !== undefined) payload.startDate = startDate;
        if (endDate !== undefined) payload.endDate = endDate;
        if (isPublished !== undefined) payload.isPublished = isPublished === true || isPublished === "true";
        if (questions !== undefined) {
            if (!Array.isArray(questions) || questions.length === 0) {
                const err = new Error("Une évaluation doit contenir au moins une question."); err.statusCode = 400; throw err;
            }
            payload.questions = questions;
        }
        if (invitedEmails !== undefined) {
            payload.invitedEmails = Array.isArray(invitedEmails) ? invitedEmails : [];
        }

        const updated = await updateDocument(COLLECTIONS.EVALUATIONS, req.params.id, payload);

        // Si on passe à l'état publié et qu'il y a des emails
        const willPublish = payload.isPublished === true;
        const currentMails = payload.invitedEmails || evalDoc.invitedEmails || [];

        if (willPublish && currentMails.length > 0) {
            const shareLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/evaluation/${evalDoc.accessLink}`;
            for (const email of currentMails) {
                sendEvaluationInvite(email, evalDoc.title, shareLink, evalDoc.startDate);
            }
        }

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
}

/**
 * Supprimer une évaluation (propriétaire ou admin).
 */
async function deleteEvaluation(req, res, next) {
    try {
        const evalDoc = await getDocumentById(COLLECTIONS.EVALUATIONS, req.params.id);
        if (!evalDoc) {
            const err = new Error("Évaluation introuvable."); err.statusCode = 404; throw err;
        }
        if (evalDoc.teacherId !== req.user.id && req.user.role !== "ADMIN") {
            const err = new Error("Action non autorisée."); err.statusCode = 403; throw err;
        }

        await deleteDocument(COLLECTIONS.EVALUATIONS, req.params.id);
        res.status(200).json({ success: true, message: "Évaluation supprimée avec succès." });
    } catch (error) {
        next(error);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCÈS PAR LIEN SÉCURISÉ (ÉLÈVE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un élève accède à l'évaluation via son lien UUID unique.
 * Les bonnes réponses sont masquées (anti-triche côté API).
 */
async function getEvaluationByLink(req, res, next) {
    try {
        const { accessLink } = req.params;

        const evalDoc = await findOneByField(COLLECTIONS.EVALUATIONS, "accessLink", accessLink);

        if (!evalDoc) {
            const err = new Error("Évaluation introuvable ou lien invalide."); err.statusCode = 404; throw err;
        }

        if (!evalDoc.isPublished) {
            const err = new Error("Cette évaluation n'est pas encore disponible."); err.statusCode = 403; throw err;
        }

        // VÉRIFICATION ANTI-INTRUSION : L'étudiant est-il sur la liste VIP ?
        if (Array.isArray(evalDoc.invitedEmails) && evalDoc.invitedEmails.length > 0) {
            const isInvited = evalDoc.invitedEmails.some(
                (mail) => mail.toLowerCase() === req.user.email.toLowerCase()
            );
            if (!isInvited) {
                const err = new Error("Accès refusé. Votre adresse e-mail n'a pas été invitée à cette évaluation.");
                err.statusCode = 403;
                throw err;
            }
        }

        // Vérifier si l'évaluation est dans sa fenêtre de temps
        const now = new Date();
        if (evalDoc.startDate && new Date(evalDoc.startDate) > now) {
            const err = new Error("Cette évaluation n'a pas encore commencé."); err.statusCode = 403; throw err;
        }
        if (evalDoc.endDate && new Date(evalDoc.endDate) < now) {
            const err = new Error("Cette évaluation est terminée."); err.statusCode = 403; throw err;
        }

        // Vérifier que l'élève n'a pas déjà soumis ses réponses
        const alreadySubmitted = await findOneByField(
            COLLECTIONS.EVAL_RESULTS,
            "studentId",
            req.user.id,
            ["evalId", "==", evalDoc.id]
        );
        if (alreadySubmitted) {
            return res.status(200).json({
                success: true,
                alreadySubmitted: true,
                message: "Vous avez déjà participé à cette évaluation.",
                data: alreadySubmitted,
            });
        }

        // Masquer les réponses correctes avant de les envoyer à l'élève
        const clientQuestions = (evalDoc.questions || []).map(({ answer, ...q }) => q);

        res.status(200).json({
            success: true,
            data: {
                id: evalDoc.id,
                title: evalDoc.title,
                subject: evalDoc.subject,
                level: evalDoc.level,
                questionTimer: evalDoc.questionTimer,  // Timer par question en secondes
                totalQuestions: clientQuestions.length,
                questions: clientQuestions,             // Les questions sans les réponses
                // NOTE FUTUR : Activation caméra -> à activer en Module 3 (prochaine étape)
            },
        });
    } catch (error) {
        next(error);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SOUMISSION DES RÉPONSES (ÉLÈVE)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'élève soumet ses réponses à une évaluation.
 * Body: { accessLink, answers: [{questionId, answer}], timeSpent, anticheatViolations }
 *
 * anticheatViolations : compteur de fois où le frontend a détecté que la fenêtre
 * était réduite / onglet caché. Cette info est sauvegardée pour que l'enseignant
 * puisse la voir sur son tableau de bord.
 */
async function submitEvaluation(req, res, next) {
    try {
        const { accessLink } = req.params;
        const { answers, timeSpent, anticheatViolations } = req.body;

        if (!Array.isArray(answers)) {
            const err = new Error("Le champ 'answers' doit être un tableau."); err.statusCode = 400; throw err;
        }

        const evalDoc = await findOneByField(COLLECTIONS.EVALUATIONS, "accessLink", accessLink);
        if (!evalDoc) {
            const err = new Error("Évaluation introuvable."); err.statusCode = 404; throw err;
        }
        if (!evalDoc.isPublished) {
            const err = new Error("Cette évaluation n'est pas encore disponible."); err.statusCode = 403; throw err;
        }

        // 1) Bloquer la double soumission (copie déjà corrigée et persistée)
        const alreadySubmitted = await findOneByField(
            COLLECTIONS.EVAL_RESULTS,
            "studentId",
            req.user.id,
            ["evalId", "==", evalDoc.id]
        );
        if (alreadySubmitted) {
            const err = new Error("Vous avez déjà soumis vos réponses pour cette évaluation."); err.statusCode = 409; throw err;
        }

        // 2) Bloquer si c'est déjà dans la file d'attente Node (Anti-Spam Massif)
        if (scoringQueue.isStudentProcessing(evalDoc.id, req.user.id)) {
            const err = new Error("Votre copie est en cours de traitement, veuillez patienter."); err.statusCode = 409; throw err;
        }

        // 3) Délégué la correction et la sauvegarde au Worker (ScoringQueue) 🔥
        scoringQueue.add({
            evalDoc,
            answers,
            studentId: req.user.id,
            studentEmail: req.user.email,
            timeSpent: Number(timeSpent) || 0,
            anticheatViolations: Number(anticheatViolations) || 0
        });

        // 4) Répondre instantanément sans attendre Firestore (Scalabilité Mass-Scoring)
        res.status(202).json({
            success: true,
            message: "Votre copie a été reçue et est en cours de correction. Les résultats finaux seront disponibles très bientôt.",
            data: {
                resultId: "PENDING_" + Date.now(),
                evalId: evalDoc.id,
                status: "PENDING_CORRECTION"
            },
        });
    } catch (error) {
        next(error);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU DE BORD ENSEIGNANT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'enseignant consulte les résultats de tous les élèves pour une de ses évaluations.
 * Il voit clairement les potentiels tricheurs (isSuspect: true).
 */
async function getEvaluationResults(req, res, next) {
    try {
        const evalDoc = await getDocumentById(COLLECTIONS.EVALUATIONS, req.params.id);
        if (!evalDoc) {
            const err = new Error("Évaluation introuvable."); err.statusCode = 404; throw err;
        }
        if (evalDoc.teacherId !== req.user.id && req.user.role !== "ADMIN") {
            const err = new Error("Accès non autorisé."); err.statusCode = 403; throw err;
        }

        const result = await listDocuments(COLLECTIONS.EVAL_RESULTS, {
            filters: [["evalId", "==", req.params.id]],
            orderBy: ["createdAt", "desc"],
            limit: 100,
        });

        res.status(200).json({
            success: true,
            evalTitle: evalDoc.title,
            participantCount: result.docs.length,
            suspectCount: result.docs.filter((r) => r.isSuspect).length,
            data: result.docs,
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createEvaluation,
    getMyEvaluations,
    getEvaluationById,
    updateEvaluation,
    deleteEvaluation,
    getEvaluationByLink,
    submitEvaluation,
    getEvaluationResults,
};
