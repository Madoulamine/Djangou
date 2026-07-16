const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { upload } = require("../config/multer");
const { createCourseValidators, updateCourseValidators } = require("../utils/validators");
const {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
} = require("../controllers/courses.controller");

const router = express.Router();

// Récupérer la liste des cours (avec filtres, pagination, et vérification des droits internes)
router.get("/", authMiddleware, getCourses);

// Consulter un cours précis (incrémente automatiquement le compteur de vues)
router.get("/:id", authMiddleware, getCourseById);

// Créer un nouveau cours. Seul un ENSEIGNANT ou un ADMIN peut le faire.
// Le fichier (PDF ou Vidéo) est reçu dans le champ multipart "file".
router.post(
    "/",
    authMiddleware,
    roleMiddleware("ENSEIGNANT", "ADMIN"),
    upload.single("file"),
    createCourseValidators,
    createCourse
);

// Modifier un cours (Seul le propriétaire ou l'ADMIN est autorisé via le contrôleur)
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("ENSEIGNANT", "ADMIN"),
    upload.single("file"),
    updateCourseValidators,
    updateCourse
);

// Supprimer un cours (Seul le propriétaire ou l'ADMIN est autorisé via le contrôleur)
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("ENSEIGNANT", "ADMIN"),
    deleteCourse
);

module.exports = router;
