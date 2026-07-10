const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { db, FieldValue } = require("../config/firebase");
const { sendResetPasswordEmail } = require("./email.service");
const {
  USER_ROLES,
  COLLECTIONS,
  BCRYPT_SALT_ROUNDS,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  RESET_TOKEN_EXPIRES_MS,
} = require("../utils/constants");

function createConflictError(message) {
  const error = new Error(message);
  error.statusCode = 409;

  return error;
}

function createAuthError(message) {
  const error = new Error(message);
  error.statusCode = 401;

  return error;
}

// Recupere le document utilisateur correspondant a un email, ou null.
async function findUserByEmail(email) {
  const snapshot = await db
    .collection(COLLECTIONS.USERS)
    .where("email", "==", email)
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0].data();
}

// Verifie si un compte existe deja avec cet email.
async function emailExists(email) {
  return Boolean(await findUserByEmail(email));
}

// Cree un nouvel utilisateur avec mot de passe hashe et renvoie ses infos publiques.
async function registerUser({ nom, prenom, email, password, role }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (await emailExists(normalizedEmail)) {
    throw createConflictError("Un compte existe deja avec cet email.");
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  const userRef = db.collection(COLLECTIONS.USERS).doc();
  const now = FieldValue.serverTimestamp();
  const userRole = role || USER_ROLES.ELEVE;

  await userRef.set({
    id: userRef.id,
    nom: nom.trim(),
    prenom: prenom.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: userRole,
    isBlocked: false,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: userRef.id,
    nom: nom.trim(),
    prenom: prenom.trim(),
    email: normalizedEmail,
    role: userRole,
    isBlocked: false,
  };
}

function assertJwtSecret() {
  if (!process.env.JWT_SECRET) {
    const error = new Error("Configuration JWT manquante.");
    error.statusCode = 500;
    throw error;
  }
}

function signAccessToken(user) {
  assertJwtSecret();

  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, type: "access" },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  assertJwtSecret();

  return jwt.sign(
    { id: user.id, type: "refresh" },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

// Empreinte non reversible du refresh token, seule stockee en base.
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function verifyRefreshToken(refreshToken) {
  assertJwtSecret();

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (decoded.type !== "refresh") {
      throw createAuthError("Refresh token invalide.");
    }

    return decoded;
  } catch (error) {
    if (error.statusCode === 401) {
      throw error;
    }

    throw createAuthError("Refresh token invalide ou expire.");
  }
}

function publicUser(user) {
  return {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    isBlocked: user.isBlocked,
  };
}

// Verifie les identifiants, genere un access token et un refresh token, et stocke ce dernier (hashe) en base.
async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw createAuthError("Email ou mot de passe incorrect.");
  }

  if (user.isBlocked) {
    throw createAuthError("Ce compte a ete bloque.");
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await db.collection(COLLECTIONS.USERS).doc(user.id).update({
    refreshTokenHash: hashToken(refreshToken),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { accessToken, refreshToken, user: publicUser(user) };
}

// Verifie le refresh token fourni contre celui stocke en base et renvoie un nouvel access token.
async function refreshAccessToken({ refreshToken }) {
  const decoded = verifyRefreshToken(refreshToken);

  const userDoc = await db.collection(COLLECTIONS.USERS).doc(decoded.id).get();

  if (!userDoc.exists) {
    throw createAuthError("Utilisateur introuvable.");
  }

  const user = userDoc.data();

  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    throw createAuthError("Refresh token invalide ou revoque.");
  }

  if (user.isBlocked) {
    throw createAuthError("Ce compte a ete bloque.");
  }

  return { accessToken: signAccessToken(user) };
}

// Verifie puis supprime le refresh token stocke pour terminer la session.
async function logoutUser({ refreshToken }) {
  const decoded = verifyRefreshToken(refreshToken);
  const userRef = db.collection(COLLECTIONS.USERS).doc(decoded.id);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw createAuthError("Utilisateur introuvable.");
  }

  const user = userDoc.data();

  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    throw createAuthError("Refresh token invalide ou deja revoque.");
  }

  await userRef.update({
    refreshTokenHash: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

// Cree un token UUID de reinitialisation, le stocke (hashe) en base et envoie un email.
async function requestPasswordReset({ email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  // On ne revele pas si l'email existe ou non pour eviter l'enumeration de comptes.
  if (!user) return;

  // UUID v4 : suffisamment aleatoire et non predictible pour un usage securise.
  const token = uuidv4();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRES_MS);

  // Suppression des anciens tokens pour cet utilisateur (un seul actif a la fois).
  const existingSnapshot = await db
    .collection(COLLECTIONS.RESET_TOKENS)
    .where("userId", "==", user.id)
    .get();

  const deleteBatch = db.batch();
  existingSnapshot.docs.forEach((doc) => deleteBatch.delete(doc.ref));
  await deleteBatch.commit();

  // Stockage du nouveau token hashe avec sa date d'expiration.
  await db.collection(COLLECTIONS.RESET_TOKENS).add({
    userId: user.id,
    tokenHash,
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Construction du lien envoye dans l'email (le token brut, jamais le hash).
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  await sendResetPasswordEmail({ to: normalizedEmail, resetLink });
}

// Verifie le token, met a jour le mot de passe et invalide le token utilise.
async function resetPassword({ token, newPassword }) {
  const tokenHash = hashToken(token);

  // Recherche du document correspondant au hash du token fourni.
  const snapshot = await db
    .collection(COLLECTIONS.RESET_TOKENS)
    .where("tokenHash", "==", tokenHash)
    .limit(1)
    .get();

  if (snapshot.empty) {
    const error = new Error("Token invalide ou expiré.");
    error.statusCode = 400;
    throw error;
  }

  const tokenDoc = snapshot.docs[0];
  const tokenData = tokenDoc.data();

  // Verification de l'expiration : expiresAt est un objet Date ou un Timestamp Firestore.
  const expiresAt =
    tokenData.expiresAt instanceof Date
      ? tokenData.expiresAt
      : tokenData.expiresAt.toDate();

  if (Date.now() > expiresAt.getTime()) {
    // Nettoyage immediat du token expire.
    await tokenDoc.ref.delete();
    const error = new Error("Token invalide ou expiré.");
    error.statusCode = 400;
    throw error;
  }

  const userRef = db.collection(COLLECTIONS.USERS).doc(tokenData.userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    const error = new Error("Utilisateur introuvable.");
    error.statusCode = 404;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  // Mise a jour du mot de passe et invalidation du refresh token existant par securite.
  await userRef.update({
    password: hashedPassword,
    refreshTokenHash: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Suppression du token de reinitialisation apres utilisation (usage unique).
  await tokenDoc.ref.delete();
}

module.exports = {
  registerUser,
  emailExists,
  loginUser,
  refreshAccessToken,
  logoutUser,
  requestPasswordReset,
  resetPassword,
};
