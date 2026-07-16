const USER_ROLES = Object.freeze({
  ELEVE: "ELEVE",
  ENSEIGNANT: "ENSEIGNANT",
  ADMIN: "ADMIN",
});

// Roles autorises a l'auto-inscription (ADMIN est cree hors de ce flux).
const REGISTERABLE_ROLES = [USER_ROLES.ELEVE, USER_ROLES.ENSEIGNANT];

const COLLECTIONS = Object.freeze({
  USERS: "users",
  // Collection qui stocke les tokens temporaires de reinitialisation de mot de passe.
  RESET_TOKENS: "resetTokens",
});

const BCRYPT_SALT_ROUNDS = 12;

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
// Duree de validite du token de reinitialisation de mot de passe : 1 heure en millisecondes.
const RESET_TOKEN_EXPIRES_MS = 60 * 60 * 1000;

module.exports = {
  USER_ROLES,
  REGISTERABLE_ROLES,
  COLLECTIONS,
  BCRYPT_SALT_ROUNDS,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  RESET_TOKEN_EXPIRES_MS,
};
