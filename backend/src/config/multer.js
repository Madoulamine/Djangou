const multer = require("multer");

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const maxSizeMb = Number(process.env.UPLOAD_MAX_SIZE_MB) || 100;
const maxSizeBytes = maxSizeMb * 1024 * 1024;

const storage = multer.memoryStorage();

function fileFilter(req, file, callback) {
  if (allowedMimeTypes.has(file.mimetype)) {
    callback(null, true);
    return;
  }

  const error = new Error(
    "Type de fichier non autorise. Formats acceptes: PDF, images et videos."
  );
  error.statusCode = 400;
  callback(error);
}

// Configure Multer pour valider les fichiers avant l'envoi vers Cloudinary.
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxSizeBytes,
  },
});

module.exports = {
  upload,
  singleFileUpload: (fieldName = "file") => upload.single(fieldName),
  multipleFilesUpload: (fieldName = "files", maxCount = 5) =>
    upload.array(fieldName, maxCount),
  allowedMimeTypes,
  maxSizeBytes,
};
