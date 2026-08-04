// src/services/scoring.queue.js
// Système de buffering Node pour absorber les afflux massifs lors de la fin d'une évaluation.
// Empêche les serveurs Node et Firestore de crasher ou timeout en utilisant Firestore Batch.

const { db, FieldValue } = require("../config/firebase");
const { COLLECTIONS } = require("./firebase.service");
const { calculateScore } = require("./scoring.service");

class ScoringQueue {
    constructor() {
        this.queue = [];
        this.processingSet = new Set(); // Pour éviter les doubles soumissions en attente
        this.batchSize = 250; // Firestore limite à 500 opérations par batch. 250 est très sécurisé.
        this.processing = false;

        // Toutes les 5 secondes, on vide la file s'il y a des copies en attente
        setInterval(() => this.processQueue(), 5000);
    }

    /**
     * Vérifie si un étudiant a déjà une copie en cours de correction
     */
    isStudentProcessing(evalId, studentId) {
        return this.processingSet.has(`${evalId}_${studentId}`);
    }

    /**
     * Ajoute une copie au buffer d'attente
     */
    add(payload) {
        const { evalDoc, studentId } = payload;
        const key = `${evalDoc.id}_${studentId}`;

        if (this.processingSet.has(key)) {
            // Ignorer silencieusement si la copie est déjà dans la file (Anti-Spam)
            return;
        }

        this.processingSet.add(key);
        this.queue.push({
            ...payload,
            queuedAt: Date.now()
        });

        // Si la file dépasse la taille du lot, on traite tout de suite
        if (this.queue.length >= this.batchSize && !this.processing) {
            this.processQueue();
        }
    }

    /**
     * Le "Worker" qui corrige et envoie les résultats à Firestore
     */
    async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;

        try {
            // On extrait un lot maximum
            const chunk = this.queue.splice(0, this.batchSize);
            console.log(`[ScoringQueue] 🚀 Traitement automatique d'un lot de ${chunk.length} copies...`);

            const batch = db.batch();
            const evalCounters = {}; // Groupe l'incrémentation pour éviter une contention Firestore

            chunk.forEach((item) => {
                const { evalDoc, answers, studentId, studentEmail, timeSpent, anticheatViolations } = item;

                // 1. Correction synchrone ultra rapide (CPU, pas d'I/O)
                const result = calculateScore(evalDoc.questions || [], answers, evalDoc.level);

                // 2. Préparation du document pour Firestore
                const evalResult = {
                    evalId: evalDoc.id,
                    evalTitle: evalDoc.title,
                    studentId,
                    studentEmail,
                    score: result.score,
                    maxScore: result.maxScore,
                    scale: result.scale,
                    totalCorrect: result.totalCorrect,
                    totalQuestions: result.totalQuestions,
                    timeSpent: Number(timeSpent) || 0,
                    details: result.details,
                    anticheatViolations: Number(anticheatViolations) || 0,
                    isSuspect: (Number(anticheatViolations) || 0) >= 3,
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                };

                // 3. Attacher la création au Batch (pas encore envoyé à Firestore)
                const resultRef = db.collection(COLLECTIONS.EVAL_RESULTS).doc();
                batch.set(resultRef, evalResult);

                // 4. Accúmüler le compteur de participants par évaluation
                evalCounters[evalDoc.id] = (evalCounters[evalDoc.id] || 0) + 1;
            });

            // 4. Ajouter les incrémentations massives au lot (Batch update)
            for (const [evalId, count] of Object.entries(evalCounters)) {
                const evalRef = db.collection(COLLECTIONS.EVALUATIONS).doc(evalId);
                batch.update(evalRef, {
                    participantCount: FieldValue.increment(count)
                });
            }

            // 5. Envoi unique vers Firestore — 1 seul appel réseau pour toutes les copies !
            await batch.commit();

            // 6. Libérer les verrous SEULEMENT après succès du commit (Bug Fix : éviter le re-submit si commit échoue)
            chunk.forEach(({ evalDoc, studentId }) => {
                this.processingSet.delete(`${evalDoc.id}_${studentId}`);
            });

            console.log(`[ScoringQueue] ✅ Le lot de ${chunk.length} copies sauvegardé avec succès !`);

        } catch (error) {
            console.error("[ScoringQueue] ❌ CRITICAL ERROR lors du traitement du lot :", error);
            // En cas d'erreur de lot Firestore, l'idéal serait de réintégrer les copies (Retry).
            // Mais pour une V1, un simple log garantit que l'app ne crashe pas.
        } finally {
            this.processing = false;

            // S'il reste encore des copies, rappeler immédiatement
            if (this.queue.length > 0) {
                setTimeout(() => this.processQueue(), 200);
            }
        }
    }
}

// Singleton global de l'application
const scoringQueue = new ScoringQueue();
module.exports = scoringQueue;
