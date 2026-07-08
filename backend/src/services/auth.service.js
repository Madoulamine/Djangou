const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { db, FieldValue } = require("../config/firebase");
const {
  USER_ROLES,
  COLLECTIONS,
  BCRYPT_SALT_ROUNDS,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
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
  assertJwtSecret();

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
  } catch (error) {
    throw createAuthError("Refresh token invalide ou expire.");
  }

  if (decoded.type !== "refresh") {
    throw createAuthError("Refresh token invalide.");
  }

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

// Invalide le refresh token stocke pour l'utilisateur (deconnexion).
async function logoutUser(userId) {
  await db.collection(COLLECTIONS.USERS).doc(userId).update({
    refreshTokenHash: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

module.exports = {
  registerUser,
  emailExists,
  loginUser,
  refreshAccessToken,
  logoutUser,
};
