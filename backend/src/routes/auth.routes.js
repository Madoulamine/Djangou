const express = require("express");
const { register, login, refresh, logout } = require("../controllers/auth.controller");
const {
  registerValidators,
  loginValidators,
  refreshValidators,
  logoutValidators,
} = require("../utils/validators");

const router = express.Router();

router.post("/register", registerValidators, register);
router.post("/login", loginValidators, login);
router.post("/refresh", refreshValidators, refresh);
router.post("/logout", logoutValidators, logout);

module.exports = router;
