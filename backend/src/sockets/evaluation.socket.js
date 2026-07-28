// src/sockets/evaluation.socket.js
// Gère tous les événements WebSockets relatifs au système anti-triche des Évaluations Numériques

const { COLLECTIONS, getDocumentById, createDocument, updateDocument, findOneByField } = require("../services/firebase.service");

module.exports = (io, socket) => {
    // Le joueur/étudiant connecté, authentifié via JWT
    const user = socket.user;

    /**
     * L'étudiant rejoint une évaluation (via ID). 
     * Cette action force l'appel à la Webcam côté Front.
     * input: { evalId: "XXX" }
     */
    socket.on("eval:join", (data) => {
        try {
            const { evalId } = data;
            if (!evalId) return;

            // L'élève rejoint la salle de l'évaluation
            socket.join(`eval_${evalId}`);

            // Ordonne au client d'activer sa caméra
            socket.emit("eval:request_camera", {
                message: "Veuillez activer votre caméra pour l'évaluation."
            });

            console.log(`[Eval] Élève ${user.prenom} a rejoint l'épreuve ${evalId}`);
        } catch (error) {
            console.error("Erreur eval:join:", error.message);
        }
    });

    /**
     * Anti-triche critique : L'étudiant a masqué son app / changé d'onglet.
     * Cette sanction est de déclencher automatiquement un Score Punitif (01/20 ou 01/10).
     * input: { evalId }
     */
    socket.on("eval:anti_cheat_violation", async (data) => {
        try {
            const { evalId } = data;
            if (!evalId) return;

            // 1. Récupérer l'évaluation pour connaître le barème (Primaire/Université vs Secondaire) et l'ID du Prof
            const evalDoc = await getDocumentById(COLLECTIONS.EVALUATIONS, evalId);
            if (!evalDoc) return;

            // 2. Vérifier si l'élève n'a pas déjà un résultat (pour éviter les doublons ou bugs réseau)
            const alreadySubmitted = await findOneByField(
                COLLECTIONS.EVAL_RESULTS,
                "studentId",
                user.id,
                ["evalId", "==", evalId]
            );

            if (alreadySubmitted) return; // Sanction déjà prise ou élève a déjà rendu sa copie

            // 3. Imposer un score punitif selon le barème du niveau 
            const isSecondary = evalDoc.level === "SECONDAIRE";
            const maxScore = isSecondary ? 20 : 10;
            const punitiveScore = 1;

            const evalResult = {
                evalId: evalId,
                evalTitle: evalDoc.title,
                studentId: user.id,
                studentEmail: user.email,
                score: punitiveScore,
                maxScore: maxScore,
                scale: maxScore,
                totalCorrect: 0,
                totalQuestions: evalDoc.questions ? evalDoc.questions.length : 0,
                timeSpent: 0,
                details: [],
                anticheatViolations: 1, // Marqué comme fraude immédiate 
                isSuspect: true,
                createdAt: new Date().toISOString()
            };

            // 4. Sauvegarde officielle dans Firestore 
            await createDocument(COLLECTIONS.EVAL_RESULTS, evalResult);

            // 4.b. Incrémenter le compteur de participants de l'évaluation
            await updateDocument(COLLECTIONS.EVALUATIONS, evalId, {
                participantCount: (evalDoc.participantCount || 0) + 1,
            });

            // 5. Exclure l'élève (il gèle son écran de Front)
            socket.emit("eval:disqualified", {
                message: "Triche détectée (Changement de fenêtre). Vous avez été exclu de l'évaluation.",
                score: punitiveScore
            });
            // On le sort de la salle d'évaluation
            socket.leave(`eval_${evalId}`);

            // 6. Notifier l'enseignant en temps réel (L'enseignant écoute `user_TEACHERID`)
            io.to(`user_${evalDoc.teacherId}`).emit("eval:teacher_alert", {
                evalId: evalId,
                studentName: `${user.prenom} ${user.nom}`,
                message: "Suspicion de triche confirmée (exclusion automatique et attribution du score 01)."
            });

            console.log(`[Anti-Triche 🔴] Élève ${user.prenom} exclu de l'évaluation ${evalId}`);
        } catch (error) {
            console.error("Erreur anti_cheat_violation:", error.message);
        }
    });
};
