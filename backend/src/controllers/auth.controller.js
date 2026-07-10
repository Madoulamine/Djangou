const { validationResult } = require("express-validator");
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  requestPasswordReset,
  resetPassword: resetPasswordService,
} = require("../services/auth.service");

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

// Authentifie un utilisateur et renvoie un access token et un refresh token.
async function login(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw createValidationError(errors);
    }

    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await loginUser({
      email,
      password,
    });

    res.status(200).json({
      success: true,
      message: "Connexion reussie.",
      data: { accessToken, refreshToken, user },
    });
  } catch (error) {
    next(error);
  }
}

// Genere un nouvel access token a partir d'un refresh token valide.
async function refresh(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw createValidationError(errors);
    }

    const { refreshToken } = req.body;
    const { accessToken } = await refreshAccessToken({ refreshToken });

    res.status(200).json({
      success: true,
      message: "Token rafraichi avec succes.",
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
}

// Invalide le refresh token fourni par le client.
async function logout(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw createValidationError(errors);
    }

    const { refreshToken } = req.body;
    await logoutUser({ refreshToken });

    res.status(200).json({
      success: true,
      message: "Deconnexion reussie.",
    });
  } catch (error) {
    next(error);
  }
}

// Demande de reinitialisation : envoie un email avec un token valable 1h.
// Repond toujours 200 pour ne pas reveler si l'email est enregistre ou non.
async function forgotPassword(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw createValidationError(errors);
    }

    await requestPasswordReset({ email: req.body.email });

    res.status(200).json({
      success: true,
      message:
        "Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.",
    });
  } catch (error) {
    next(error);
  }
}

// Utilise le token recu par email pour remplacer le mot de passe.
async function resetPassword(req, res, next) {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      throw createValidationError(errors);
    }

    const { token, newPassword } = req.body;
    await resetPasswordService({ token, newPassword });

    res.status(200).json({
      success: true,
      message: "Mot de passe reinitialise avec succes. Veuillez vous reconnecter.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword };
