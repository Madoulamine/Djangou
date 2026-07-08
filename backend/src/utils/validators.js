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

module.exports = { registerValidators, loginValidators, refreshValidators };
