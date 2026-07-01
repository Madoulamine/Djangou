const path = require("path");
const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const requiredEnv = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  throw new Error(
    `Configuration Firebase incomplete. Variables manquantes: ${missingEnv.join(", ")}`
  );
}

// Reconstruit la cle privee Firebase quand elle vient du fichier .env.
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey,
};

const appOptions = {
  credential: admin.credential.cert(serviceAccount),
};

if (process.env.FIREBASE_STORAGE_BUCKET) {
  appOptions.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
}

if (process.env.FIREBASE_DATABASE_URL) {
  appOptions.databaseURL = process.env.FIREBASE_DATABASE_URL;
}

// Evite de reinitialiser Firebase si le module est importe plusieurs fois.
const firebaseApp =
  admin.apps.length > 0 ? admin.app() : admin.initializeApp(appOptions);

const db = admin.firestore();
const auth = admin.auth();
const bucket = process.env.FIREBASE_STORAGE_BUCKET
  ? admin.storage().bucket()
  : null;

db.settings({ ignoreUndefinedProperties: true });

async function checkFirestoreConnection() {
  await db.collection("_health").limit(1).get();
  return true;
}

module.exports = {
  admin,
  firebaseApp,
  db,
  auth,
  bucket,
  checkFirestoreConnection,
  FieldValue: admin.firestore.FieldValue,
  Timestamp: admin.firestore.Timestamp,
};
