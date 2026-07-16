/**
 * Script de test pour la connexion WebSocket (Socket.IO)
 * Usage : node scripts/test-socket.js
 * Ce script requiert que le serveur tourne sur http://localhost:5000
 * et que vous ayez un token JWT valide dans votre fichier .env comme TEST_JWT.
 */

const { io } = require("socket.io-client");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const SERVER_URL = "http://localhost:5000";

// ─── Utilitaires ──────────────────────────────────────────────────────────────
const OK = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
const INFO = "\x1b[36mℹ\x1b[0m";

function runTest(label, promise) {
    return promise
        .then(() => console.log(`  ${OK} ${label}`))
        .catch((err) => console.log(`  ${FAIL} ${label} — ${err.message}`));
}

// ─── Test 1 : Connexion SANS token (doit être rejetée) ───────────────────────
function testNoToken() {
    return new Promise((resolve, reject) => {
        const client = io(SERVER_URL, {
            transports: ["websocket"],
            reconnection: false,
            timeout: 3000,
        });

        client.on("connect", () => {
            client.disconnect();
            reject(new Error("Connexion acceptée sans token (comportement inattendu !)"));
        });

        client.on("connect_error", (err) => {
            client.disconnect();
            // On s'attend à un rejet -> c'est le cas qui réussit le test
            resolve();
        });

        setTimeout(() => {
            client.disconnect();
            resolve(); // Timeout : le serveur a refusé sans réponse
        }, 4000);
    });
}

// ─── Test 2 : Connexion avec un FAUX token (doit être rejetée) ───────────────
function testFakeToken() {
    return new Promise((resolve, reject) => {
        const client = io(SERVER_URL, {
            transports: ["websocket"],
            reconnection: false,
            timeout: 3000,
            auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.FAKE.FAKE" },
        });

        client.on("connect", () => {
            client.disconnect();
            reject(new Error("Connexion acceptée avec un faux token (comportement inattendu !)"));
        });

        client.on("connect_error", (err) => {
            client.disconnect();
            resolve(); // Rejet confirme que le middleware fonctionne
        });

        setTimeout(() => {
            client.disconnect();
            resolve();
        }, 4000);
    });
}

// ─── Test 3 : Connexion avec un TOKEN VALIDE (si fourni dans .env) ────────────
function testValidToken(token) {
    return new Promise((resolve, reject) => {
        if (!token) {
            return reject(new Error("Aucun TEST_JWT trouvé dans .env. Ajoutez TEST_JWT=<votre_accessToken>"));
        }

        const client = io(SERVER_URL, {
            transports: ["websocket"],
            reconnection: false,
            timeout: 5000,
            auth: { token },
        });

        client.on("connect", () => {
            console.log(`     ${INFO} Socket ID obtenu : ${client.id}`);
            client.disconnect();
            resolve();
        });

        client.on("connect_error", (err) => {
            client.disconnect();
            reject(new Error(`Connexion refusée avec un token valide : ${err.message}`));
        });

        setTimeout(() => {
            client.disconnect();
            reject(new Error("Timeout - vérifiez que le serveur tourne sur le port 5000"));
        }, 5500);
    });
}

// ─── Lancement des tests ──────────────────────────────────────────────────────
async function main() {
    const testToken = process.env.TEST_JWT;

    console.log("\n\x1b[1m═══════════════════════════════════════════\x1b[0m");
    console.log("\x1b[1m  Tests WebSocket (Socket.IO) — Djangou     \x1b[0m");
    console.log("\x1b[1m═══════════════════════════════════════════\x1b[0m\n");

    await runTest("Connexion rejetée sans token", testNoToken());
    await runTest("Connexion rejetée avec faux token", testFakeToken());
    await runTest("Connexion acceptée avec token valide (TEST_JWT)", testValidToken(testToken));

    console.log("\n\x1b[1m═══════════════════════════════════════════\x1b[0m\n");
}

main().catch(console.error);
