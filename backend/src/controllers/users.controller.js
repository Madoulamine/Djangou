const { db } = require("../config/firebase");
const { COLLECTIONS } = require("../utils/constants");

// Récupère la liste des utilisateurs de la plateforme avec pagination.
// Ne renvoie jamais les mots de passe et les tokens hashés pour des raisons de sécurité.
async function getAllUsers(req, res, next) {
    try {
        const limit = parseInt(req.query.limit, 10) || 20;
        const { startAfterDocId } = req.query;

        let query = db
            .collection(COLLECTIONS.USERS)
            .orderBy("createdAt", "desc")
            .limit(limit);

        if (startAfterDocId) {
            const docRef = await db.collection(COLLECTIONS.USERS).doc(startAfterDocId).get();
            if (docRef.exists) {
                query = query.startAfter(docRef);
            }
        }

        const snapshot = await query.get();
        const data = snapshot.docs.map((doc) => {
            const user = doc.data();
            // On retire les données sensibles avant de les envoyer au client
            delete user.password;
            delete user.refreshTokenHash;
            return user;
        });

        const lastDocId =
            snapshot.docs.length > 0
                ? snapshot.docs[snapshot.docs.length - 1].id
                : null;

        res.status(200).json({
            success: true,
            data,
            lastDocId,
        });
    } catch (error) {
        next(error);
    }
}

// Alterne l'état de blocage d'un utilisateur (isBlocked: true/false).
// L'utilisateur bloqué perdra l'accès dès sa prochaine requête nécessitant l'authentification
// ou lorsqu'il tentera de se connecter.
async function blockUser(req, res, next) {
    try {
        const { id } = req.params;
        const userRef = db.collection(COLLECTIONS.USERS).doc(id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            const error = new Error("Utilisateur introuvable.");
            error.statusCode = 404;
            throw error;
        }

        const currentStatus = userDoc.data().isBlocked || false;
        const newStatus = !currentStatus;

        await userRef.update({
            isBlocked: newStatus,
            updatedAt: new Date(),
        });

        res.status(200).json({
            success: true,
            message: `Utilisateur ${newStatus ? "bloqué" : "débloqué"} avec succès.`,
            data: { id, isBlocked: newStatus },
        });
    } catch (error) {
        next(error);
    }
}

// Supprime définitivement un utilisateur de la base Firestore.
async function deleteUser(req, res, next) {
    try {
        const { id } = req.params;
        const userRef = db.collection(COLLECTIONS.USERS).doc(id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            const error = new Error("Utilisateur introuvable.");
            error.statusCode = 404;
            throw error;
        }

        await userRef.delete();

        // Note: D'autres suppressions en cascade peuvent être requises plus tard (ex: cours de l'utilisateur)
        // Mais selon l'étape 8, la suppression simple du compte est suffisante.

        res.status(200).json({
            success: true,
            message: "Utilisateur supprimé avec succès.",
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllUsers,
    blockUser,
    deleteUser,
};
