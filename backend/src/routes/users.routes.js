const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { USER_ROLES } = require("../utils/constants");
const {
    getAllUsers,
    blockUser,
    deleteUser,
} = require("../controllers/users.controller");

const router = express.Router();

// Liste paginée de tous les comptes (Seul l'ADMIN peut accéder)
router.get(
    "/",
    authMiddleware,
    roleMiddleware(USER_ROLES.ADMIN),
    getAllUsers
);

// Bloque ou débloque un compte
router.put(
    "/:id/block",
    authMiddleware,
    roleMiddleware(USER_ROLES.ADMIN),
    blockUser
);

// Supprime définitivement un compte
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(USER_ROLES.ADMIN),
    deleteUser
);

module.exports = router;
