const { validationResult } = require("express-validator");
const { registerUser, loginUser } = require("../services/auth.service");

function createValidationError(errors) {
  const error = new Error(errors.array({ onlyFirstError: true })[0].msg);
  error.statusCode = 400;

  return error;
}

// Inscrit un nouvel utilisateur (eleve ou enseignant) avec mot de passe hashe.
async function register(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw createValidationError(errors);
    }

    const { nom, prenom, email, password, role } = req.body;
    const user = await registerUser({ nom, prenom, email, password, role });

    res.status(201).json({
      success: true,
      message: "Compte cree avec succes.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

// Authentifie un utilisateur et renvoie un token JWT.
async function login(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw createValidationError(errors);
    }

    const { email, password } = req.body;
    const { token, user } = await loginUser({ email, password });

    res.status(200).json({
      success: true,
      message: "Connexion reussie.",
      data: { token, user },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login };
