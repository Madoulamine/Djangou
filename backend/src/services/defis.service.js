// src/services/defis.service.js
// Logique métier complète pour les Défis Asynchrones 1v1 (Étape 17)

const { db, FieldValue } = require("../config/firebase");
const { COLLECTIONS, createDocument, updateDocument, getDocumentById } = require("./firebase.service");
const { sendNotification } = require("./notification.service");

/**
 * Calcule un score rapide pour un défi. (Temporaire, le frontend enverra souvent le score direct)
 * On utilise les données de performance pour générer un résultat robuste.
 */
function comparePerformance(scoreA, timeA, scoreB, timeB) {
    if (scoreA > scoreB) return -1; // A gagne
    if (scoreB > scoreA) return 1;  // B gagne

    // Égalité parfaite de score, on regarde le temps
    if (timeA < timeB) return -1;   // A gagne (plus rapide)
    if (timeB < timeA) return 1;    // B gagne (plus rapide)

    return 0; // DRAW
}

/**
 * Lance un nouveau défi asynchrone. Le challenger joue d'abord et crée la demande.
 */
async function createDefi(challenger, challengedId, quizId, challengerScore, challengerTimeMs, io = null) {
    if (challenger.id === challengedId) {
        const err = new Error("Vous ne pouvez pas vous défier vous-même.");
        err.statusCode = 400; throw err;
    }

    // Vérifier l'existence de l'adversaire et du quiz
    const [challenged, quiz] = await Promise.all([
        getDocumentById(COLLECTIONS.USERS, challengedId),
        getDocumentById(COLLECTIONS.QUIZZES, quizId)
    ]);

    if (!challenged) {
        const err = new Error("Adversaire introuvable.");
        err.statusCode = 404; throw err;
    }
    if (!quiz) {
        const err = new Error("Le quiz sélectionné n'existe pas.");
        err.statusCode = 404; throw err;
    }

    // Création du document DEFI (asynchrone, tour 1 terminé)
    const defiData = {
        quizId,
        quizTitle: quiz.title,
        challengerId: challenger.id,
        challengedId,
        status: "PENDING_OPPONENT", // L'adversaire doit jouer
        challengerScore: Number(challengerScore) || 0,
        challengerTimeMs: Number(challengerTimeMs) || 0,
        challengedScore: null,
        challengedTimeMs: null,
        winnerId: null
    };

    const defi = await createDocument(COLLECTIONS.DEFIS, defiData);

    // DÉLÉGUER la notification au service centralisé (Optimisation !)
    await sendNotification({
        userId: challengedId,
        type: "DEFI_RECEIVED",
        title: "Nouveau Défi !",
        message: `${challenger.prenom} ${challenger.nom} vous a défié au quiz "${quiz.title}". À vous de jouer !`,
        data: { defiId: defi.id, challengerId: challenger.id }
    }, io);

    return defi;
}

/**
 * L'adversaire répond au défi (il joue).
 */
async function respondToDefi(defiId, challengedUser, accept, challengedScore = 0, challengedTimeMs = 0, io = null) {
    const defi = await getDocumentById(COLLECTIONS.DEFIS, defiId);

    if (!defi) {
        const err = new Error("Défi introuvable.");
        err.statusCode = 404; throw err;
    }

    if (defi.challengedId !== challengedUser.id) {
        const err = new Error("Vous n'êtes pas le destinataire de ce défi.");
        err.statusCode = 403; throw err;
    }

    if (defi.status !== "PENDING_OPPONENT") {
        const err = new Error("Ce défi n'est plus en attente.");
        err.statusCode = 400; throw err;
    }

    // S'il refuse le défi
    if (!accept) {
        const updated = await updateDocument(COLLECTIONS.DEFIS, defiId, { status: "REJECTED" });
        return updated;
    }

    // S'il accepte et joue
    const scoreB = Number(challengedScore) || 0;
    const timeB = Number(challengedTimeMs) || 0;

    const result = comparePerformance(defi.challengerScore, defi.challengerTimeMs, scoreB, timeB);

    let winnerId = "DRAW"; // Égalité parfaite
    if (result === -1) winnerId = defi.challengerId;
    if (result === 1) winnerId = defi.challengedId;

    const updateData = {
        challengedScore: scoreB,
        challengedTimeMs: timeB,
        winnerId,
        status: "COMPLETED"
    };

    const updatedDefi = await updateDocument(COLLECTIONS.DEFIS, defiId, updateData);

    // DÉLÉGUER la notification du résultat au challenger
    const iWon = (winnerId === challengedUser.id);
    const message = iWon
        ? `${challengedUser.prenom} a relevé votre défi et a GAGNÉ !`
        : `${challengedUser.prenom} a relevé votre défi et a PERDU. Bravo pour votre victoire !`;

    await sendNotification({
        userId: defi.challengerId,
        type: "DEFI_RESULT",
        title: "Résultat du Défi",
        message,
        data: { defiId: defi.id, winnerId }
    }, io);

    return updatedDefi;
}

/**
 * Obtenir l'historique de ses défis (lancés et reçus).
 */
async function getUserDefis(userId) {
    // Dans Firestore, un OR logique est coûteux sans array-contains.
    // L'approche optimale : 2 requêtes limitées, mergées côté serveur (c'est instantané pour des petites limites).
    const [sentSnap, receivedSnap] = await Promise.all([
        db.collection(COLLECTIONS.DEFIS).where("challengerId", "==", userId).orderBy("createdAt", "desc").limit(20).get(),
        db.collection(COLLECTIONS.DEFIS).where("challengedId", "==", userId).orderBy("createdAt", "desc").limit(20).get()
    ]);

    const allDefis = [...sentSnap.docs, ...receivedSnap.docs]
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    // Dédupliquer si jamais il se défie lui-même (bloqué mais par sécurité)
    const uniqueIds = new Set();
    return allDefis.filter(d => {
        if (uniqueIds.has(d.id)) return false;
        uniqueIds.add(d.id);
        return true;
    });
}

module.exports = {
    createDefi,
    respondToDefi,
    getUserDefis
};
