const { body } = require("express-validator");
const { REGISTERABLE_ROLES } = require("./constants");

const registerValidators = [
  body("nom").trim().notEmpty().withMessage("Le nom est requis."),
  body("prenom").trim().notEmpty().withMessage("Le prenom est requis."),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Email invalide.")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Le mot de passe doit contenir au moins 6 caracteres."),
  body("role")
    .optional()
    .isIn(REGISTERABLE_ROLES)
    .withMessage(
      `Le role doit etre l'un des suivants : ${REGISTERABLE_ROLES.join(", ")}.`
    ),
];

const loginValidators = [
  body("email").trim().isEmail().withMessage("Email invalide.").normalizeEmail(),
  body("password").notEmpty().withMessage("Le mot de passe est requis."),
];

const refreshValidators = [
  body("refreshToken").notEmpty().withMessage("Le refresh token est requis."),
];

const logoutValidators = [
  body("refreshToken").notEmpty().withMessage("Le refresh token est requis."),
];

const forgotPasswordValidators = [
  body("email").trim().isEmail().withMessage("Email invalide.").normalizeEmail(),
];

const resetPasswordValidators = [
  body("token").notEmpty().withMessage("Le token est requis."),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Le nouveau mot de passe doit contenir au moins 6 caracteres."),
];

const createCourseValidators = [
  body("title").trim().notEmpty().withMessage("Le titre du cours est requis."),
  body("targetLevels")
    .custom((val) => {
      let levels = val;
      if (typeof val === "string") {
        try { levels = JSON.parse(val); } catch { levels = [val]; }
      }
      if (!Array.isArray(levels) || levels.length === 0) {
        throw new Error("Au moins un niveau (targetLevels) doit etre specifié.");
      }
      return true;
    }),
  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished doit être un booléen.")
    .customSanitizer(val => val === true || val === 'true'),
];

const updateCourseValidators = [
  body("title").optional().trim().notEmpty().withMessage("Le titre ne peut pas être vide."),
  body("targetLevels")
    .optional()
    .custom((val) => {
      let levels = val;
      if (typeof val === "string") {
        try { levels = JSON.parse(val); } catch { levels = [val]; }
      }
      if (!Array.isArray(levels) || levels.length === 0) {
        throw new Error("Au moins un niveau (targetLevels) doit etre specifié.");
      }
      return true;
    }),
];

const VALID_LEVELS = ["PRIMAIRE", "SECONDAIRE"];
const VALID_DIFFICULTIES = ["FACILE", "MOYEN", "DIFFICILE"];

// Validators pour la création d'un quiz
const createQuizValidators = [
  body("title").trim().notEmpty().withMessage("Le titre du quiz est requis."),
  body("questions")
    .isArray({ min: 1 })
    .withMessage("Un quiz doit contenir au moins une question."),
  body("questions.*.question")
    .trim()
    .notEmpty()
    .withMessage("Chaque question doit avoir un énoncé."),
  body("questions.*.type")
    .optional()
    .isIn(["QCM", "LIBRE"])
    .withMessage("Le type de question doit être QCM ou LIBRE."),
  body("level")
    .optional()
    .isIn(VALID_LEVELS)
    .withMessage(`Le niveau doit être l'un des suivants : ${VALID_LEVELS.join(", ")}.`),
  body("difficulty")
    .isIn(VALID_DIFFICULTIES)
    .withMessage(`La difficulté doit être l'une des suivantes : ${VALID_DIFFICULTIES.join(", ")}.`),
  body("questionTimer")
    .optional()
    .isInt({ min: 5 })
    .withMessage("Le timer par question doit être d'au moins 5 secondes."),
  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished doit être un booléen."),
];

// Validators pour la soumission des réponses d'un quiz
const submitAnswersValidators = [
  body("answers")
    .isArray()
    .withMessage("Le champ answers doit être un tableau."),
  body("answers.*.questionId")
    .notEmpty()
    .withMessage("Chaque réponse doit avoir un questionId."),
  body("timeSpent")
    .optional()
    .isInt({ min: 0 })
    .withMessage("timeSpent doit être un entier positif (secondes)."),
];

module.exports = {
  registerValidators,
  loginValidators,
  refreshValidators,
  logoutValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  createCourseValidators,
  updateCourseValidators,
  createQuizValidators,
  submitAnswersValidators,
};
