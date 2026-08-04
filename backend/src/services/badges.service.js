// src/services/badges.service.js
// Logique métier centrale pour l'attribution automatique des badges (Module 3 — Étape 14)
//
// Règles d'attribution :
//   FELICITATIONS  → quiz solo : 5 parties parfaites (0 faute) + 10 cours terminés
//   QUIZ_MASTER    → multijoueur : top 2 du classement final avec 0 faute
//
// Principe fondamental : un badge est TOUJOURS unique par (studentId + type).
// Si l'élève le possède déjà, on s'arrête silencieusement.

const {
    COLLECTIONS,
    listDocuments,
    createDocument,
} = require("./firebase.service");

const { db } = require("../config/firebase");

// ─────────────────────────────────────────────
// Catalogue des badges disponibles
// ─────────────────────────────────────────────
const BADGE_CATALOG = Object.freeze({
    FELICITATIONS: {
        type: "FELICITATIONS",
        label: "Félicitations !",
        description: "5 quiz parfaits accomplis et 10 cours terminés.",
        icon: "🏆",
    },
    QUIZ_MASTER: {
        type: "QUIZ_MASTER",
        label: "Quiz Master",
        description: "Top 2 d'une partie multijoueur avec un score parfait.",
        icon: "⚡",
    },
});

// ─────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────

/**
 * Vérifie si un élève possède déjà un badge donné.
 * Évite toute duplication avant la création.
 *
 * @param {string} studentId
 * @param {string} badgeType - clé de BADGE_CATALOG
 * @returns {Promise<boolean>}
 */
async function hasBadge(studentId, badgeType) {
    const snapshot = await db
        .collection(COLLECTIONS.BADGES)
        .where("studentId", "==", studentId)
        .where("type", "==", badgeType)
        .limit(1)
        .get();

    return !snapshot.empty;
}

/**
 * Crée un badge pour un élève dans Firestore.
 * N'est appelé qu'après confirmation qu'il ne l'a pas encore.
 *
 * @param {string} studentId
 * @param {string} studentName
 * @param {string} badgeType - clé de BADGE_CATALOG
 * @returns {Promise<object>} Le document badge créé
 */
async function awardBadge(studentId, studentName, badgeType) {
    const definition = BADGE_CATALOG[badgeType];
    if (!definition) {
        throw new Error(`Type de badge inconnu : ${badgeType}`);
    }

    const badgeData = {
        studentId,
        studentName,
        type: definition.type,
        label: definition.label,
        description: definition.description,
        icon: definition.icon,
        // createdAt / updatedAt ajoutés automatiquement par createDocument via addTimestamps()
    };

    const created = await createDocument(COLLECTIONS.BADGES, badgeData);
    console.log(`[BADGE] "${definition.label}" attribué à ${studentName} (${studentId})`);
    return created;
}

// ─────────────────────────────────────────────
// Triggers métier
// ─────────────────────────────────────────────

/**
 * Trigger SOLO — appelé après chaque soumission de quiz solo.
 *
 * Vérifie si l'élève remplit les 2 conditions cumulatives :
 *   1. Au moins 5 quiz parfaits (totalCorrect === totalQuestions, mode SOLO)
 *   2. Au moins 10 cours terminés (completedCourses[] dans le document users)
 *
 * Note : Firestore ne supporte pas WHERE field1 == field2 (comparaison entre champs).
 * On filtre donc côté JS après un listDocuments avec les filtres supportés.
 *
 * IMPORTANT : Cette fonction est FIRE-AND-FORGET.
 * Ne jamais l'attendre (await) dans un contrôleur HTTP ou un événement Socket.
 *
 * @param {string} studentId
 * @param {string} studentName
 * @returns {Promise<void>}
 */
async function checkAndAwardSoloBadge(studentId, studentName) {
    // Sortie rapide si le badge existe déjà
    const already = await hasBadge(studentId, "FELICITATIONS");
    if (already) return;

    // 1. Compter les quiz solo parfaits de cet élève
    //    On charge un maximum de 200 résultats pour éviter un full-scan coûteux
    const { docs: soloResults } = await listDocuments(COLLECTIONS.QUIZ_RESULTS, {
        filters: [
            ["studentId", "==", studentId],
            ["mode", "==", "SOLO"],
        ],
        limit: 200,
    });

    // Un quiz est "parfait" si toutes ses questions ont été correctement répondues
    const perfectCount = soloResults.filter(
        (r) =>
            typeof r.totalCorrect === "number" &&
            typeof r.totalQuestions === "number" &&
            r.totalQuestions > 0 &&
            r.totalCorrect === r.totalQuestions
    ).length;

    if (perfectCount < 5) return; // Pas encore 5 quiz parfaits

    // 2. Vérifier le nombre de cours terminés dans le profil utilisateur
    const userSnap = await db.collection(COLLECTIONS.USERS).doc(studentId).get();
    if (!userSnap.exists) return;

    const completedCourses = Array.isArray(userSnap.data().completedCourses)
        ? userSnap.data().completedCourses
        : [];

    if (completedCourses.length < 10) return; // Pas encore 10 cours terminés

    // ✅ Les 2 conditions sont remplies — on attribue le badge
    await awardBadge(studentId, studentName, "FELICITATIONS");
}

/**
 * Trigger MULTIJOUEUR — appelé à la fin d'une partie multijoueur pour chaque
 * joueur du top 2.
 *
 * Règles :
 *   - Le joueur doit être dans le top 2 du classement final (rang 1 ou 2)
 *   - Il doit avoir répondu correctement à TOUTES les questions (score parfait)
 *     → Le contrôle du rang est fait côté appelant (multiplayer.service.js)
 *
 * IMPORTANT : Cette fonction est FIRE-AND-FORGET.
 * Ne jamais l'attendre (await) dans un événement Socket.
 *
 * @param {string} studentId
 * @param {string} studentName
 * @param {boolean} isPerfectScore - true si le joueur n'a raté aucune question
 * @returns {Promise<void>}
 */
async function checkAndAwardMultiplayerBadge(studentId, studentName, isPerfectScore) {
    // Score non parfait → pas de badge
    if (!isPerfectScore) return;

    // L'élève a-t-il déjà le badge Quiz Master ?
    const already = await hasBadge(studentId, "QUIZ_MASTER");
    if (already) return;

    await awardBadge(studentId, studentName, "QUIZ_MASTER");
}

// ─────────────────────────────────────────────
// Lecture des badges (utilisé par le contrôleur)
// ─────────────────────────────────────────────

/**
 * Récupère tous les badges d'un élève, triés du plus récent au plus ancien.
 *
 * @param {string} studentId
 * @returns {Promise<Array>}
 */
async function getBadgesByStudent(studentId) {
    const { docs } = await listDocuments(COLLECTIONS.BADGES, {
        filters: [["studentId", "==", studentId]],
        orderBy: ["createdAt", "desc"],
        limit: 100,
    });

    return docs;
}

module.exports = {
    BADGE_CATALOG,
    checkAndAwardSoloBadge,
    checkAndAwardMultiplayerBadge,
    getBadgesByStudent,
};
