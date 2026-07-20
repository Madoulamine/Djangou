// src/services/multiplayer.service.js
// Logique métier In-Memory pour les Quiz Multijoueurs (Étape 11)

const { getDocumentById, COLLECTIONS } = require("./firebase.service");

// Base de données temporaire In-Memory pour le temps réel
// Map<roomId, RoomData>
const activeRooms = new Map();

/**
 * Génère un code de salle unique (6 caractères)
 */
function generateRoomCode() {
    let code;
    do {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (activeRooms.has(code));
    return code;
}

/**
 * Nettoie la réponse pour une comparaison stricte (anti-casse et espaces)
 */
function normalizeAnswer(answer) {
    return (answer || "").toString().trim().toLowerCase();
}

/**
 * Créer un nouveau défi (Salle d'attente)
 * C'est un étudiant qui initie le défi.
 */
async function createChallenge(user, quizId) {
    const quiz = await getDocumentById(COLLECTIONS.QUIZZES, quizId);

    if (!quiz) throw new Error("Quiz introuvable.");
    if (!quiz.isPublished) throw new Error("Quiz indisponible.");
    if (!quiz.questions || quiz.questions.length === 0) throw new Error("Ce quiz n'a pas de questions.");

    const roomId = generateRoomCode();

    // Le "Host" est le joueur qui a lancé le défi
    const roomData = {
        roomId,
        quizId,
        quizTitle: quiz.title,
        hostId: user.id,
        status: "LOBBY", // LOBBY -> PLAYING -> FINISHED
        questions: quiz.questions,
        currentQuestionIndex: -1,
        questionTimerFallback: quiz.questionTimer || 30, // Default 30s si vide
        players: new Map(), // Map<userId, {id, name, score, isDisqualified}>
        timerInterval: null,
        firstAnswerRevealed: false
    };

    // On ajoute le créateur à la salle
    roomData.players.set(user.id, {
        id: user.id,
        name: user.prenom + " " + user.nom,
        score: 0,
        isDisqualified: false
    });

    activeRooms.set(roomId, roomData);
    return roomData;
}

/**
 * Rejoindre un défi (Salle d'attente)
 */
function joinChallenge(roomId, user) {
    const room = activeRooms.get(roomId);
    if (!room) throw new Error("Salle introuvable.");
    if (room.status !== "LOBBY") throw new Error("Le jeu a déjà commencé ou est terminé.");

    if (!room.players.has(user.id)) {
        room.players.set(user.id, {
            id: user.id,
            name: user.prenom + " " + user.nom,
            score: 0,
            isDisqualified: false
        });
    }
    return room;
}

/**
 * Démarre le quiz et la boucle de distribution (Géré par io)
 */
function startChallenge(io, roomId, userId) {
    const room = activeRooms.get(roomId);
    if (!room) throw new Error("Salle introuvable.");
    if (room.hostId !== userId) throw new Error("Seul le créateur peut lancer le défi.");
    if (room.status !== "LOBBY") throw new Error("Jeu déjà démarré.");

    room.status = "PLAYING";

    // Lancer la première question après 3 secondes d'échauffement
    io.to(roomId).emit("quiz:countdown", { seconds: 3 });

    setTimeout(() => {
        nextQuestion(io, room);
    }, 3000);

    return room;
}

/**
 * Boucle asynchrone : Passe à la question suivante ou termine le jeu
 */
function nextQuestion(io, room) {
    // Si timeout précédent en cours, on l'annule par sécurité
    if (room.timerInterval) clearTimeout(room.timerInterval);

    room.currentQuestionIndex++;
    room.firstAnswerRevealed = false; // Reset pour la nouvelle question

    if (room.currentQuestionIndex >= room.questions.length) {
        // LE JEU EST TERMINÉ
        room.status = "FINISHED";
        const leaderboard = getLeaderboard(room);
        io.to(room.roomId).emit("quiz:finished", { leaderboard });

        // Nettoyer la room de la mémoire après 2 minutes (le temps qu'ils regardent les scores)
        setTimeout(() => activeRooms.delete(room.roomId), 120000);
        return;
    }

    const question = room.questions[room.currentQuestionIndex];
    // Masquer la réponse pour l'envoi au client
    const { answer, ...clientQuestion } = question;
    const timeLimit = room.questionTimerFallback;

    // Distribue la question
    io.to(room.roomId).emit("quiz:question_start", {
        questionNumber: room.currentQuestionIndex + 1,
        totalQuestions: room.questions.length,
        question: clientQuestion,
        timeLimit
    });

    // Démarre le timer pour clôturer la question
    room.timerInterval = setTimeout(() => {
        io.to(room.roomId).emit("quiz:question_timeout", {
            correctAnswer: answer // Affiche la réponse lorsque le temps s'écoule
        });

        // Envoi du leaderboard temporaire
        io.to(room.roomId).emit("quiz:leaderboard", { leaderboard: getLeaderboard(room) });

        // Passer à la question suivante après un petit délai de 5s pour lire la réponse
        setTimeout(() => {
            if (activeRooms.has(room.roomId)) {
                nextQuestion(io, room);
            }
        }, 5000);

    }, timeLimit * 1000);
}

/**
 * Traiter la soumission d'une réponse par un élève
 */
function submitAnswer(io, roomId, userId, submittedAnswer) {
    const room = activeRooms.get(roomId);
    if (!room || room.status !== "PLAYING") return false;

    const player = room.players.get(userId);
    if (!player || player.isDisqualified) return false;

    const currentQuestion = room.questions[room.currentQuestionIndex];
    if (!currentQuestion) return false;

    // Evaluation
    const isCorrect = normalizeAnswer(submittedAnswer) === normalizeAnswer(currentQuestion.answer);

    if (isCorrect) {
        // Le système évalue si c'est le 1er (100%) ou les suivants (50%)
        if (!room.firstAnswerRevealed) {
            player.score += (currentQuestion.points || 1);
            room.firstAnswerRevealed = true; // Activer le flag : les autres auront 50%
        } else {
            player.score += (currentQuestion.points || 1) * 0.5;
        }
    }

    // On peut optionnellement envoyer un ACK au joueur pour lui dire qu'on a bien reçu
    return { isCorrect, currentScore: player.score };
}

/**
 * Disqualifier un joueur (Anti-triche)
 */
function disqualifyPlayer(io, roomId, userId) {
    const room = activeRooms.get(roomId);
    if (!room) return;

    const player = room.players.get(userId);
    if (player) {
        player.isDisqualified = true;
        // Notifie toute la room qu'il a été disqualifié pour triche
        io.to(roomId).emit("quiz:anti_cheat_alert", {
            message: `${player.name} a été disqualifié pour avoir quitté la page (anti-triche).`
        });
    }
}

/**
 * Convertit le Map des joueurs en Array trié par score.
 */
function getLeaderboard(room) {
    const playersArr = Array.from(room.players.values());
    playersArr.sort((a, b) => b.score - a.score);
    return playersArr;
}

module.exports = {
    createChallenge,
    joinChallenge,
    startChallenge,
    submitAnswer,
    disqualifyPlayer
};
