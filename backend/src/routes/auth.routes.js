const express = require("express");
const { register, login, refresh, logout, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const {
  registerValidators,
  loginValidators,
  refreshValidators,
  logoutValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
} = require("../utils/validators");

const router = express.Router();

router.post("/register", registerValidators, register);
router.post("/login", loginValidators, login);
router.post("/refresh", refreshValidators, refresh);
router.post("/logout", logoutValidators, logout);
// Routes de reinitialisation de mot de passe (flux en deux etapes).
router.post("/forgot-password", forgotPasswordValidators, forgotPassword);
router.post("/reset-password", resetPasswordValidators, resetPassword);

module.exports = router;
