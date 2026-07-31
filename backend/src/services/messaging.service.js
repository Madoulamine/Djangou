// src/services/messaging.service.js
// Logique métier centrale pour la Messagerie Privée Sécurisée (Module 3 — Étape 16)
//
// Règles d'accès au contact (NON-CONTOURNABLES) :
//
//   Élève → Enseignant  : L'élève doit être inscrit à au moins un cours de l'enseignant.
//   Élève → Élève       : Les deux doivent partager au moins un contexte commun :
//                         cours | session multijoueur (future) | concours | défi
//   Enseignant → Élève  : L'élève doit être inscrit à l'un de ses cours.
//   ADMIN               : Peut contacter n'importe qui.
//
// Consentement : Le premier message crée une conversation en statut "PENDING".
//   Le destinataire doit Accepter → "ACTIVE" ou Refuser → "REJECTED".
//   À l'état REJECTED l'expéditeur ne peut plus jamais rouvrir la même conversation.
//
// Anti-harcèlement : Chaque utilisateur peut bloquer un autre (blockedUsers[] dans users)
//   ou mettre son profil en mode "Ne pas déranger" (messagingEnabled: false).

const { db, FieldValue } = require("../config/firebase");
const {
    COLLECTIONS,
    createDocument,
    updateDocument,
    getDocumentById,
    listDocuments,
    findOneByField,
} = require("./firebase.service");

// ─────────────────────────────────────────────
// Helpers internes — Vérification du droit au contact
// ─────────────────────────────────────────────

/**
 * Renvoie true si l'élève est inscrit à au moins un cours
 * dont l'auteur est l'enseignant cible.
 */
async function isEnrolledInTeacherCourse(studentId, teacherId) {
    // Un élève "inscrit" a l'ID du cours dans son champ enrolledCourses[]
    const studentDoc = await getDocumentById(COLLECTIONS.USERS, studentId);
    if (!studentDoc) return false;

    const enrolled = studentDoc.enrolledCourses || [];
    if (enrolled.length === 0) return false;

    // On vérifie si l'un des cours appartient à cet enseignant
    const snapshot = await db
        .collection(COLLECTIONS.COURSES)
        .where("__name__", "in", enrolled.slice(0, 10)) // Firestore limite "in" à 10
        .where("authorId", "==", teacherId)
        .limit(1)
        .get();

    return !snapshot.empty;
}

/**
 * Renvoie true si deux élèves partagent au moins un contexte
 * éducatif commun (cours, concours, défi).
 * La session multijoueur est vérifiée via matchHistory (ajouté progressivement).
 */
async function shareCommonContext(userAId, userBId) {
    const [userA, userB] = await Promise.all([
        getDocumentById(COLLECTIONS.USERS, userAId),
        getDocumentById(COLLECTIONS.USERS, userBId),
    ]);

    if (!userA || !userB) return false;

    const enrolledA = new Set(userA.enrolledCourses || []);
    const enrolledB = new Set(userB.enrolledCourses || []);

    // 1. Cours commun
    for (const courseId of enrolledA) {
        if (enrolledB.has(courseId)) return true;
    }

    // 2. Défi commun (ex: défis 1v1)
    const defiSnap = await db
        .collection(COLLECTIONS.DEFIS)
        .where("participantsIds", "array-contains", userAId)
        .limit(20)
        .get();

    for (const doc of defiSnap.docs) {
        const participants = doc.data().participantsIds || [];
        if (participants.includes(userBId)) return true;
    }

    // 3. Concours commun
    const concoursSnap = await db
        .collection(COLLECTIONS.CONCOURS)
        .where("candidateIds", "array-contains", userAId)
        .limit(20)
        .get();

    for (const doc of concoursSnap.docs) {
        const candidates = doc.data().candidateIds || [];
        if (candidates.includes(userBId)) return true;
    }

    // 4. Historique de match multijoueur (champ matchHistory[] dans users)
    const matchHistoryA = new Set(userA.matchHistory || []);
    if (matchHistoryA.has(userBId)) return true;

    return false;
}

/**
 * Vérifie si l'expéditeur a le droit de contacter le destinataire
 * selon les règles métier de la plateforme.
 * Lève une erreur explicite si l'accès est refusé.
 *
 * @param {object} sender - req.user (porte role, id, etc.)
 * @param {object} recipient - document Firestore de l'utilisateur cible
 */
async function assertContactAllowed(sender, recipient) {
    // ADMIN : droit universel
    if (sender.role === "ADMIN") return;

    // Cible inexistante
    if (!recipient) {
        const err = new Error("Utilisateur destinataire introuvable.");
        err.statusCode = 404;
        throw err;
    }

    // La cible a désactivé sa messagerie
    if (recipient.messagingEnabled === false) {
        const err = new Error("Cet utilisateur n'accepte pas de nouveaux messages.");
        err.statusCode = 403;
        throw err;
    }

    // L'expéditeur est bloqué par la cible
    const blockedByRecipient = recipient.blockedUsers || [];
    if (blockedByRecipient.includes(sender.id)) {
        const err = new Error("Vous ne pouvez pas contacter cet utilisateur.");
        err.statusCode = 403;
        throw err;
    }

    const senderRole = sender.role;
    const recipientRole = recipient.role;

    if (senderRole === "ELEVE" && recipientRole === "ENSEIGNANT") {
        const ok = await isEnrolledInTeacherCourse(sender.id, recipient.id);
        if (!ok) {
            const err = new Error(
                "Vous pouvez uniquement contacter un enseignant dont vous suivez au moins un cours."
            );
            err.statusCode = 403;
            throw err;
        }
    } else if (senderRole === "ELEVE" && recipientRole === "ELEVE") {
        const ok = await shareCommonContext(sender.id, recipient.id);
        if (!ok) {
            const err = new Error(
                "Vous pouvez uniquement contacter un élève avec qui vous avez partagé une activité (cours, défi, concours ou match)."
            );
            err.statusCode = 403;
            throw err;
        }
    } else if (senderRole === "ENSEIGNANT" && recipientRole === "ELEVE") {
        const ok = await isEnrolledInTeacherCourse(recipient.id, sender.id);
        if (!ok) {
            const err = new Error(
                "Vous ne pouvez contacter que les élèves inscrits à l'un de vos cours."
            );
            err.statusCode = 403;
            throw err;
        }
    }
    // ENSEIGNANT → ENSEIGNANT : libre (pour la coordination pédagogique)
}

/**
 * Cherche une conversation existante entre deux utilisateurs.
 * Utilise array-contains + filtrage JS (Firestore ne supporte pas
 * IS_SUBSET ou ARRAY_CONTAINS_ALL sur deux valeurs arbitraires).
 */
async function findExistingConversation(userAId, userBId) {
    const snap = await db
        .collection(COLLECTIONS.CONVERSATIONS)
        .where("participantsIds", "array-contains", userAId)
        .get();

    const existing = snap.docs.find((doc) =>
        (doc.data().participantsIds || []).includes(userBId)
    );

    return existing ? { id: existing.id, ...existing.data() } : null;
}

// ─────────────────────────────────────────────
// Service public — Conversations
// ─────────────────────────────────────────────

/**
 * Crée ou retourne la conversation entre l'expéditeur et le destinataire.
 * La première conversation créée part en statut PENDING.
 * Le destinataire doit accepter pour qu'elle devienne ACTIVE.
 */
async function getOrCreateConversation(sender, recipientId) {
    const recipient = await getDocumentById(COLLECTIONS.USERS, recipientId);

    // Lève une erreur si le contact n'est pas autorisé
    await assertContactAllowed(sender, recipient);

    // Vérifier si une conversation existe déjà
    const existing = await findExistingConversation(sender.id, recipientId);
    if (existing) {
        // Bloquer la ré-ouverture si la précédente a été refusée
        if (existing.status === "REJECTED") {
            const err = new Error(
                "Cette conversation a été refusée et ne peut pas être rouverte."
            );
            err.statusCode = 403;
            throw err;
        }
        return existing;
    }

    // Créer une nouvelle conversation en attente de réponse
    const conversationData = {
        participantsIds: [sender.id, recipientId],
        participantsInfo: {
            [sender.id]: { name: `${sender.prenom} ${sender.nom}`, role: sender.role },
            [recipientId]: { name: `${recipient.prenom} ${recipient.nom}`, role: recipient.role },
        },
        status: "PENDING",       // PENDING → ACTIVE → ARCHIVED | REJECTED
        initiatorId: sender.id,
        lastMessageAt: null,
        lastMessagePreview: null,
    };

    return createDocument(COLLECTIONS.CONVERSATIONS, conversationData);
}

/**
 * Récupère toutes les conversations d'un utilisateur.
 */
async function getUserConversations(userId) {
    const snap = await db
        .collection(COLLECTIONS.CONVERSATIONS)
        .where("participantsIds", "array-contains", userId)
        .orderBy("updatedAt", "desc")
        .limit(30)
        .get();

    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Réponse du destinataire à une demande de conversation.
 * @param {string} conversationId
 * @param {string} userId - l'utilisateur qui répond (doit être le destinataire)
 * @param {"ACTIVE"|"REJECTED"} decision
 */
async function respondToConversationRequest(conversationId, userId, decision) {
    const conversation = await getDocumentById(COLLECTIONS.CONVERSATIONS, conversationId);

    if (!conversation) {
        const err = new Error("Conversation introuvable.");
        err.statusCode = 404;
        throw err;
    }

    if (conversation.initiatorId === userId) {
        const err = new Error("Seul le destinataire peut accepter ou refuser la demande.");
        err.statusCode = 403;
        throw err;
    }

    if (!["ACTIVE", "REJECTED"].includes(decision)) {
        const err = new Error("Décision invalide. Valeurs acceptées : ACTIVE, REJECTED.");
        err.statusCode = 400;
        throw err;
    }

    return updateDocument(COLLECTIONS.CONVERSATIONS, conversationId, { status: decision });
}

// ─────────────────────────────────────────────
// Service public — Messages
// ─────────────────────────────────────────────

/**
 * Sauvegarde un message en Firestore et met à jour le snapshot de la conversation.
 * Lève une erreur si :
 *   - La conversation n'existe pas ou n'est pas ACTIVE
 *   - L'expéditeur n'est pas participant
 */
async function saveMessage(conversationId, sender, text) {
    const conversation = await getDocumentById(COLLECTIONS.CONVERSATIONS, conversationId);

    if (!conversation) {
        const err = new Error("Conversation introuvable.");
        err.statusCode = 404;
        throw err;
    }

    if (conversation.status !== "ACTIVE") {
        const err = new Error("Cette conversation n'est pas encore active ou a été refusée.");
        err.statusCode = 403;
        throw err;
    }

    if (!(conversation.participantsIds || []).includes(sender.id)) {
        const err = new Error("Vous n'êtes pas participant de cette conversation.");
        err.statusCode = 403;
        throw err;
    }

    if (!text || String(text).trim().length === 0) {
        const err = new Error("Le contenu du message ne peut pas être vide.");
        err.statusCode = 400;
        throw err;
    }

    const preview = String(text).slice(0, 50);

    const messageData = {
        conversationId,
        senderId: sender.id,
        senderName: `${sender.prenom} ${sender.nom}`,
        text: String(text).trim(),
        read: false,
    };

    // Transaction : Écriture du message + mise à jour du snapshot de la conversation
    const batch = db.batch();

    const msgRef = db.collection(COLLECTIONS.MESSAGES).doc();
    batch.set(msgRef, {
        ...messageData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    const convRef = db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId);
    batch.update(convRef, {
        lastMessageAt: FieldValue.serverTimestamp(),
        lastMessagePreview: preview,
        updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return { id: msgRef.id, ...messageData };
}

/**
 * Récupère l'historique paginé d'une conversation.
 * @param {string} conversationId
 * @param {string} userId - Doit être participant
 * @param {number} limit - Nombre de messages par page
 */
async function getConversationHistory(conversationId, userId, limit = 30) {
    const conversation = await getDocumentById(COLLECTIONS.CONVERSATIONS, conversationId);

    if (!conversation) {
        const err = new Error("Conversation introuvable.");
        err.statusCode = 404;
        throw err;
    }

    if (!(conversation.participantsIds || []).includes(userId)) {
        const err = new Error("Accès non autorisé à cette conversation.");
        err.statusCode = 403;
        throw err;
    }

    const snap = await db
        .collection(COLLECTIONS.MESSAGES)
        .where("conversationId", "==", conversationId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).reverse();
}

/**
 * Marque tous les messages non-lus d'une conversation comme lus pour un utilisateur.
 */
async function markMessagesAsRead(conversationId, userId) {
    const snap = await db
        .collection(COLLECTIONS.MESSAGES)
        .where("conversationId", "==", conversationId)
        .where("read", "==", false)
        .where("senderId", "!=", userId) // On ne marque que les messages des autres
        .get();

    if (snap.empty) return;

    const batch = db.batch();
    snap.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
    });
    await batch.commit();
}

// ─────────────────────────────────────────────
// Service public — Modération
// ─────────────────────────────────────────────

/**
 * Bloque un utilisateur : l'ajoute dans le tableau blockedUsers[] de l'instigateur.
 */
async function blockUser(blockerId, targetId) {
    if (blockerId === targetId) {
        const err = new Error("Vous ne pouvez pas vous bloquer vous-même.");
        err.statusCode = 400;
        throw err;
    }

    await db.collection(COLLECTIONS.USERS).doc(blockerId).update({
        blockedUsers: FieldValue.arrayUnion(targetId),
    });
}

/**
 * Signale une conversation à l'administration.
 * Crée un document dans la collection "reports".
 */
async function reportConversation(conversationId, reporterId, reason) {
    const conversation = await getDocumentById(COLLECTIONS.CONVERSATIONS, conversationId);

    if (!conversation || !(conversation.participantsIds || []).includes(reporterId)) {
        const err = new Error("Conversation introuvable ou vous n'en êtes pas participant.");
        err.statusCode = 403;
        throw err;
    }

    return createDocument("reports", {
        type: "CONVERSATION",
        conversationId,
        reporterId,
        reason: String(reason || "Non précisé").slice(0, 500),
        status: "PENDING", // À traiter par un ADMIN
    });
}

module.exports = {
    getOrCreateConversation,
    getUserConversations,
    respondToConversationRequest,
    saveMessage,
    getConversationHistory,
    markMessagesAsRead,
    blockUser,
    reportConversation,
};
