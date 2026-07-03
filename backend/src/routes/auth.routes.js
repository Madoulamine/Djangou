const express = require("express");
const { register, login } = require("../controllers/auth.controller");
const {
  registerValidators,
  loginValidators,
} = require("../utils/validators");

const router = express.Router();

router.post("/register", registerValidators, register);
router.post("/login", loginValidators, login);

module.exports = router;
