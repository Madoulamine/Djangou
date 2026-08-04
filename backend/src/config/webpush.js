// src/config/webpush.js
// Configuration ultra-optimisée pour les Push Notifications PWA

const webpush = require("web-push");
const fs = require("fs");
const path = require("path");
require("dotenv").config(); // S'assurer que le .env est lu

let publicKey = process.env.VAPID_PUBLIC_KEY;
let privateKey = process.env.VAPID_PRIVATE_KEY;

// Auto-génération des clés si absentes (très pratique pour l'environnement de dev/test)
if (!publicKey || !privateKey) {
    console.log("[WebPush] Aucune clé VAPID trouvée. Auto-génération en cours...");
    const vapidKeys = webpush.generateVAPIDKeys();
    publicKey = vapidKeys.publicKey;
    privateKey = vapidKeys.privateKey;

    try {
        const envPath = path.join(__dirname, "../../.env");
        const appendData = `\n# Web Push VAPID Keys\nVAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}\n`;
        fs.appendFileSync(envPath, appendData);
        console.log("[WebPush] Clés VAPID sauvegardées dans .env avec succès.");
    } catch (err) {
        console.error("[WebPush] Attention: Impossible d'écrire dans .env", err.message);
    }
}

webpush.setVapidDetails(
    "mailto:contact@djangou.com",
    publicKey,
    privateKey
);

module.exports = {
    webpush,
    publicKey
};
