// src/services/scoring.service.js
// Calcule automatiquement le score d'un élève à la soumission d'un quiz

/**
 * Barèmes de notation selon le niveau scolaire (défini dans README.md)
 * - Primaire et Université : /10
 * - Secondaire             : /20
 */
const SCORING_SCALES = Object.freeze({
    PRIMAIRE: { max: 10, label: "/10" },
    UNIVERSITE: { max: 10, label: "/10" },
    SECONDAIRE: { max: 20, label: "/20" },
});

/**
 * Retourne le barème applicable pour un niveau donné.
 * Si le niveau est inconnu, on applique le barème /10 par défaut.
 * @param {string} level - ex. "PRIMAIRE", "SECONDAIRE", "UNIVERSITE"
 * @returns {{ max: number, label: string }}
 */
function getScale(level) {
    const key = (level || "").toUpperCase();
    return SCORING_SCALES[key] || SCORING_SCALES.PRIMAIRE;
}

/**
 * Corrige les réponses d'un quiz et calcule le score sur l'échelle correcte.
 *
 * Chaque question du quiz possède :
 *   - id        : identifiant de la question
 *   - type      : "QCM" | "LIBRE"
 *   - answer    : la bonne réponse attendue (string)
 *   - points    : coefficient de la question (défaut : 1)
 *
 * Chaque réponse de l'élève (answers) est un objet { questionId, answer }.
 *
 * @param {Array} questions   - tableau des questions du quiz (depuis Firestore)
 * @param {Array} answers     - tableau des réponses soumises par l'élève
 * @param {string} level      - niveau scolaire du quiz
 * @returns {{ score: number, maxScore: number, scale: string, details: Array }}
 */
function calculateScore(questions, answers, level) {
    const scale = getScale(level);

    // Construire un dictionnaire réponse-élève pour un accès rapide
    const studentAnswerMap = {};
    (answers || []).forEach(({ questionId, answer }) => {
        studentAnswerMap[questionId] = (answer || "").trim().toLowerCase();
    });

    let totalPoints = 0;        // Points cumulés obtenus par l'élève
    let totalPossible = 0;      // Total maximum des points disponibles
    const details = [];         // Détail question par question

    (questions || []).forEach((question) => {
        const { id, type, answer: correctAnswer, points = 1 } = question;
        totalPossible += points;

        const studentAnswer = studentAnswerMap[id] || "";
        const correct = correctAnswer
            ? studentAnswer === correctAnswer.trim().toLowerCase()
            : false;

        // Types supportés : QCM (comparaison exacte) et LIBRE (comparaison exacte aussi,
        // la correction manuelle pourra être ajoutée en Module 3)
        const earnedPoints = correct ? points : 0;
        totalPoints += earnedPoints;

        details.push({
            questionId: id,
            type: type || "QCM",
            studentAnswer: studentAnswerMap[id] || null,
            correctAnswer: correctAnswer || null,
            isCorrect: correct,
            pointsEarned: earnedPoints,
            pointsMax: points,
        });
    });

    // Ramener le score sur l'échelle du niveau (ex. /20 pour secondaire)
    const score =
        totalPossible > 0
            ? parseFloat(((totalPoints / totalPossible) * scale.max).toFixed(2))
            : 0;

    return {
        score,
        maxScore: scale.max,
        scale: scale.label,
        totalCorrect: details.filter((d) => d.isCorrect).length,
        totalQuestions: questions.length,
        details,
    };
}

module.exports = { calculateScore, getScale };
