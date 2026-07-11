const { validationResult } = require("express-validator");
const {
    COLLECTIONS,
    createDocument,
    getDocumentById,
    updateDocument,
    deleteDocument,
    listDocuments,
} = require("../services/firebase.service");
const { db } = require("../config/firebase"); // au cas où on a besoin de db.collection
const { uploadBufferToCloudinary, deleteCloudinaryResource } = require("../config/cloudinary");

/**
 * Crée un nouveau cours (PDF ou Vidéo).
 * Vérifie les rôles et l'existence du fichier.
 */
async function createCourse(req, res, next) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error("Erreur de validation");
            error.statusCode = 400;
            error.errors = errors.array();
            throw error;
        }

        const { title, description, subject, isPublished } = req.body;

        // Parser targetLevels (qui peut arriver comme un JSON string vu qu'on upload avec FormData)
        let targetLevels = req.body.targetLevels;
        if (typeof targetLevels === "string") {
            try { targetLevels = JSON.parse(targetLevels); } catch { targetLevels = [targetLevels]; }
        }

        let fileData = null;

        // Si un fichier est fourni, l'envoyer sur Cloudinary
        if (req.file) {
            const uploadResult = await uploadBufferToCloudinary(req.file, {
                folder: "djangou/courses",
            });

            fileData = {
                url: uploadResult.url,
                publicId: uploadResult.publicId,
                resourceType: uploadResult.resourceType,
                format: uploadResult.format,
                name: req.file.originalname,
            };
        }

        const newCourse = {
            title,
            description: description || "",
            subject: subject || "Non spécifié",
            targetLevels: targetLevels || [],
            teacherId: req.user.id,
            teacherName: req.user.email, // On utilise l'email pour le nom par défaut si on n'a pas plus d'info
            isPublished: isPublished === true || isPublished === "true",
            viewCount: 0,
        };

        if (fileData) {
            newCourse.file = fileData;
        }

        const created = await createDocument(COLLECTIONS.COURSES, newCourse);

        res.status(201).json({
            success: true,
            data: created,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Récupère les cours pour la liste avec pagination
 * Les professeurs/admins peuvent voir les brouillons, les élèves uniquement les publiés.
 */
async function getCourses(req, res, next) {
    try {
        const { subject, level, startAfterId } = req.query;
        const limit = Number(req.query.limit) || 100;

        let filters = [];

        // Si l'utilisateur est un ELEVE, il ne voit que les cours publiés
        if (req.user.role === "ELEVE") {
            filters.push(["isPublished", "==", true]);
        }

        if (subject) {
            filters.push(["subject", "==", subject]);
        }

        if (level) {
            filters.push(["targetLevels", "array-contains", level]);
        }

        let startAfterDoc = null;
        if (startAfterId) {
            const docSnap = await db.collection(COLLECTIONS.COURSES).doc(startAfterId).get();
            if (docSnap.exists) {
                startAfterDoc = docSnap;
            }
        }

        // orderBy createdAt decroissant
        // ATTENTION: sur Firestore, si on combine des "==" avec un autre "==", l'orderBy nécessite un index.
        const result = await listDocuments(COLLECTIONS.COURSES, {
            filters,
            orderBy: ["createdAt", "desc"],
            limit,
            startAfterDoc
        });

        res.status(200).json({
            success: true,
            data: result.docs,
            lastDocId: result.lastDoc ? result.lastDoc.id : null,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Récupère un cours par son ID, et incrémente vue
 */
async function getCourseById(req, res, next) {
    try {
        const courseId = req.params.id;
        const course = await getDocumentById(COLLECTIONS.COURSES, courseId);

        if (!course) {
            const err = new Error("Cours non trouvé.");
            err.statusCode = 404;
            throw err;
        }

        // Un eleve ne peut pas voir un cours en brouillon
        if (!course.isPublished && req.user.role === "ELEVE") {
            const err = new Error("Accès refusé. Ce cours n'est pas encore publié.");
            err.statusCode = 403;
            throw err;
        }

        // Incremente viewCount en asynchrone (non-bloquant)
        updateDocument(COLLECTIONS.COURSES, courseId, { viewCount: (course.viewCount || 0) + 1 }).catch(() => { });

        // Retour client immédiat
        course.viewCount = (course.viewCount || 0) + 1;

        res.status(200).json({
            success: true,
            data: course,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Mise à jour d'un cours. Seul le propriétaire ou un ADMIN y a droit.
 */
async function updateCourse(req, res, next) {
    try {
        const courseId = req.params.id;
        const course = await getDocumentById(COLLECTIONS.COURSES, courseId);

        if (!course) {
            const err = new Error("Cours non trouvé.");
            err.statusCode = 404;
            throw err;
        }

        // Vérifie s'il s'agit du propriétaire ou de l'admin
        if (course.teacherId !== req.user.id && req.user.role !== "ADMIN") {
            const err = new Error("Action non autorisée. Vous ne pouvez modifier que vos propres cours.");
            err.statusCode = 403;
            throw err;
        }

        const { title, description, subject, isPublished } = req.body;

        // Parser targetLevels
        let targetLevels = req.body.targetLevels;
        if (typeof targetLevels === "string") {
            try { targetLevels = JSON.parse(targetLevels); } catch { targetLevels = [targetLevels]; }
        }

        let payload = {};
        if (title) payload.title = title;
        if (description !== undefined) payload.description = description;
        if (subject) payload.subject = subject;
        if (targetLevels) payload.targetLevels = targetLevels;
        if (isPublished !== undefined) payload.isPublished = isPublished === true || isPublished === "true";

        // Gestion de l'upload d'un nouveau fichier Cloudinary (remplace l'ancien s'il existe)
        if (req.file) {
            const uploadResult = await uploadBufferToCloudinary(req.file, {
                folder: "djangou/courses",
            });

            payload.file = {
                url: uploadResult.url,
                publicId: uploadResult.publicId,
                resourceType: uploadResult.resourceType,
                format: uploadResult.format,
                name: req.file.originalname,
            };

            // Suppression asynchrone de l'ancien fichier sur cloudinary
            if (course.file && course.file.publicId) {
                deleteCloudinaryResource(course.file.publicId, course.file.resourceType).catch(() => { });
            }
        }

        const updated = await updateDocument(COLLECTIONS.COURSES, courseId, payload);

        res.status(200).json({
            success: true,
            data: updated,
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Supprime un cours : efface dans Cloudinary puis dans Firestore.
 */
async function deleteCourse(req, res, next) {
    try {
        const courseId = req.params.id;
        const course = await getDocumentById(COLLECTIONS.COURSES, courseId);

        if (!course) {
            const err = new Error("Cours non trouvé.");
            err.statusCode = 404;
            throw err;
        }

        // Vérifie propriétaire ou Admin
        if (course.teacherId !== req.user.id && req.user.role !== "ADMIN") {
            const err = new Error("Action non autorisée. Vous ne pouvez supprimer que vos propres cours.");
            err.statusCode = 403;
            throw err;
        }

        // 1. Supprimer le fichier de Cloudinary si existant
        if (course.file && course.file.publicId) {
            try {
                await deleteCloudinaryResource(course.file.publicId, course.file.resourceType);
            } catch (cloudErr) {
                console.error("Impossible de supprimer le fichier Cloudinary:", cloudErr);
                // On continue la suppression Firestore meme si Cloudinary echoue (ex. fichier deja supprimé)
            }
        }

        // 2. Supprimer de Firestore
        await deleteDocument(COLLECTIONS.COURSES, courseId);

        res.status(200).json({
            success: true,
            message: "Cours supprimé avec succès.",
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCourse,
    getCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
};
