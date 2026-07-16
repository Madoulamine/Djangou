const path = require("path");
const { Readable } = require("stream");
const { v2: cloudinary } = require("cloudinary");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const requiredEnv = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  throw new Error(
    `Configuration Cloudinary incomplete. Variables manquantes: ${missingEnv.join(", ")}`
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function getResourceType(mimetype) {
  if (mimetype.startsWith("image/")) {
    return "image";
  }

  if (mimetype.startsWith("video/")) {
    return "video";
  }

  return "raw";
}

function getUploadFolder(folder) {
  return folder || process.env.CLOUDINARY_UPLOAD_FOLDER || "djangou";
}

// Envoie un fichier Multer en memoire vers Cloudinary sans creer de fichier temporaire.
function uploadBufferToCloudinary(file, options = {}) {
  if (!file || !file.buffer) {
    throw new Error("Aucun fichier valide fourni pour l'upload Cloudinary.");
  }

  const resourceType = options.resourceType || getResourceType(file.mimetype);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: getUploadFolder(options.folder),
        resource_type: resourceType,
        public_id: options.publicId,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          resourceType: result.resource_type,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
}

async function deleteCloudinaryResource(publicId, resourceType = "image") {
  if (!publicId) {
    throw new Error("Le publicId Cloudinary est obligatoire pour supprimer un fichier.");
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}

module.exports = {
  cloudinary,
  getResourceType,
  uploadBufferToCloudinary,
  deleteCloudinaryResource,
};
