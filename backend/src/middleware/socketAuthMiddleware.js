const jwt = require("jsonwebtoken");
const { getFirebaseInstance } = require("../config/firebase");

/**
 * Middleware d'authentification pour Socket.IO.
 * Intercepte chaque demande de connexion WebSocket pour vérifier le token JWT.
 * S'assure que seul un utilisateur authentifié et non bloqué peut se connecter en temps réel.
 */
const socketAuthMiddleware = async (socket, next) => {
    try {
        // 1. Récupération du token via l'objet auth (recommandé dans Socket.io v3+)
        // Fallback sur les en-têtes authorization si necessaire
        const token =
            socket.handshake.auth?.token ||
            (socket.handshake.headers?.authorization &&
                socket.handshake.headers.authorization.split(" ")[1]);

        if (!token) {
            return next(new Error("Accès refusé. Aucun token d'authentification fourni."));
        }

        // 2. Vérification de la signature du JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Récupération des données fraîches de l'utilisateur dans Firestore
        // On fait cela pour s'assurer qu'il n'a pas été supprimé ou bloqué récemment
        const { db } = getFirebaseInstance();
        const userId = decoded.id || decoded.sub; // Tolérance pour 'id' ou 'sub'
        const userDoc = await db.collection("utilisateurs").doc(userId).get();

        if (!userDoc.exists) {
            return next(new Error("Utilisateur introuvable."));
        }

        const userData = userDoc.data();

        // 4. Vérification de sécurité (Blocage)
        if (userData.isBlocked) {
            return next(new Error("Connexion refusée : votre compte est bloqué."));
        }

        // 5. Attacher le profil complété à l'objet socket
        // Cela nous évitera de faire des requêtes Firestore inutiles lors des événements futurs
        socket.user = {
            id: userDoc.id,
            email: userData.email,
            role: userData.role,
            nom: userData.nom || "",
            prenom: userData.prenom || "",
        };

        // Succès de l'authentification -> on permet la connexion de continuer
        next();
    } catch (error) {
        console.error("[Socket Auth Error]:", error.message);

        if (error.name === "TokenExpiredError") {
            return next(new Error("Token expiré. Veuillez vous reconnecter."));
        }

        return next(new Error("Token invalide ou non autorisé."));
    }
};

module.exports = socketAuthMiddleware;
