// PRÉ-REQUIS :
//   npm install socket.io-client
//   Modifier TOKEN_ELEVE, TOKEN_PROF et EVAL_ID ci-dessous avant de lancer

const { io } = require("socket.io-client");

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION — À REMPLIR AVANT DE LANCER LE SCRIPT
// ─────────────────────────────────────────────────────────────────────────────
const SERVER_URL = "http://localhost:5000";
const TOKEN_ELEVE = "COLLER_LE_TOKEN_JWT_DE_L_ELEVE_ICI";
const TOKEN_PROF = "COLLER_LE_TOKEN_JWT_DU_PROFESSEUR_ICI";
const EVAL_ID = "COLLER_L_ID_DE_L_EVALUATION_ICI";

// ─────────────────────────────────────────────────────────────────────────────
// CONNEXION ÉLÈVE — Simule un étudiant qui rejoint l'évaluation
// ─────────────────────────────────────────────────────────────────────────────
const eleveSocket = io(SERVER_URL, {
    auth: { token: TOKEN_ELEVE }  // Le middleware socketAuth lit ce champ
});

eleveSocket.on("connect", () => {
    console.log("[ÉLÈVE 🟢] Connecté à Socket.IO — ID:", eleveSocket.id);

    // Étape 1 : Rejoindre l'évaluation (doit déclencher eval:request_camera)
    console.log("[ÉLÈVE] → Envoi 'eval:join'...");
    eleveSocket.emit("eval:join", { evalId: EVAL_ID });

    // Étape 2 : Simuler une triche après 2 secondes (changement d'onglet)
    setTimeout(() => {
        console.log("[ÉLÈVE] → Simulation de triche : envoi 'eval:anti_cheat_violation'...");
        eleveSocket.emit("eval:anti_cheat_violation", { evalId: EVAL_ID });
    }, 2000);
});

// Réception de l'ordre caméra — test que le backend répond bien
eleveSocket.on("eval:request_camera", (data) => {
    console.log("[ÉLÈVE ✅] Reçu 'eval:request_camera':", data.message);
});

// Réception de la disqualification — Preuve que l'anti-triche fonctionne
eleveSocket.on("eval:disqualified", (data) => {
    console.log("[ÉLÈVE ❌] Reçu 'eval:disqualified' — Score punitif:", data.score);
    console.log("           Message:", data.message);

    // Test terminé côté élève — on se déconnecte
    setTimeout(() => eleveSocket.disconnect(), 500);
});

eleveSocket.on("connect_error", (err) => {
    console.error("[ÉLÈVE 🔴] Erreur de connexion (vérifier le token) :", err.message);
});

// ─────────────────────────────────────────────────────────────────────────────
// CONNEXION PROFESSEUR — Simule un enseignant en observation
// ─────────────────────────────────────────────────────────────────────────────
const profSocket = io(SERVER_URL, {
    auth: { token: TOKEN_PROF }
});

profSocket.on("connect", () => {
    console.log("[PROF 🟢] Connecté à Socket.IO — ID:", profSocket.id);
    // Le prof est automatiquement dans sa room 'user_TEACHERID' (géré par socket.js)
});

// Reception de l'alerte enseignant — Preuve que la notification prof fonctionne
profSocket.on("eval:teacher_alert", (data) => {
    console.log("[PROF 🚨] Alerte reçue !");
    console.log("          Élève :", data.studentName);
    console.log("          Message:", data.message);

    // Test terminé ! Tous les événements attendus ont été reçus.
    setTimeout(() => {
        profSocket.disconnect();
        console.log("\n✅ Test Anti-Triche COMPLET. Consultez Insomnia pour confirmer la sauvegarde Firestore.");
        process.exit(0);
    }, 1000);
});

profSocket.on("connect_error", (err) => {
    console.error("[PROF 🔴] Erreur de connexion (vérifier le token) :", err.message);
});
