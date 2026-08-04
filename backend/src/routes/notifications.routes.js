// src/routes/notifications.routes.js
// Routes Web Push API (PWA)

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getVapidPublicKey, subscribe } = require("../controllers/notifications.controller");

const router = express.Router();

router.get("/vapid-public-key", getVapidPublicKey);
router.post("/subscribe", authMiddleware, subscribe);

module.exports = router;
