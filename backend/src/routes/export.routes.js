// src/routes/export.routes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
    exportToExcel,
    exportToPdf
} = require("../controllers/export.controller");

// Route: /api/export/excel?subject=XX&level=YY
router.get("/excel", authMiddleware, roleMiddleware("ENSEIGNANT", "ADMIN"), exportToExcel);

// Route: /api/export/pdf?subject=XX&level=YY
router.get("/pdf", authMiddleware, roleMiddleware("ENSEIGNANT", "ADMIN"), exportToPdf);

module.exports = router;
