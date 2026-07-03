const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db, FieldValue } = require("../config/firebase");
const {
  USER_ROLES,
  COLLECTIONS,
  BCRYPT_SALT_ROUNDS,
  JWT_EXPIRES_IN,
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

function signToken(user) {
  if (!process.env.JWT_SECRET) {
    const error = new Error("Configuration JWT manquante.");
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verifie les identifiants et renvoie un token JWT avec les infos publiques de l'utilisateur.
async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw createAuthError("Email ou mot de passe incorrect.");
  }

  if (user.isBlocked) {
    throw createAuthError("Ce compte a ete bloque.");
  }

  const token = signToken(user);

  return {
    token,
    user: {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
    },
  };
}

module.exports = { registerUser, emailExists, loginUser };
