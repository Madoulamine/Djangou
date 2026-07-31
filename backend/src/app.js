const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const errorHandler = require("./middleware/errorHandler");
const { singleFileUpload } = require("./config/multer");
const authRoutes = require("./routes/auth.routes");
const coursesRoutes = require("./routes/courses.routes");
const usersRoutes = require("./routes/users.routes");
const quizzesRoutes = require("./routes/quizzes.routes");
const evaluationsRoutes = require("./routes/evaluations.routes");
const badgesRoutes = require("./routes/badges.routes");
const messagingRoutes = require("./routes/messaging.routes");

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173"];

// Configure les middlewares globaux de securite, logs et lecture JSON.
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "OK",
    service: "Djangou API",
  });
});

app.get("/api/health/firestore", async (req, res, next) => {
  try {
    const { checkFirestoreConnection } = require("./config/firebase");

    await checkFirestoreConnection();

    res.status(200).json({
      success: true,
      message: "Firestore OK",
    });
  } catch (error) {
    next(error);
  }
});

if (process.env.NODE_ENV !== "production") {
  app.post(
    "/api/health/upload",
    singleFileUpload("file"),
    async (req, res, next) => {
      try {
        const { uploadBufferToCloudinary } = require("./config/cloudinary");

        if (!req.file) {
          const error = new Error("Aucun fichier envoye.");
          error.statusCode = 400;
          throw error;
        }

        const uploadResult = await uploadBufferToCloudinary(req.file, {
          folder: "djangou/health",
        });

        res.status(201).json({
          success: true,
          message: "Upload Cloudinary OK",
          data: uploadResult,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get("/api/health/error", (req, res, next) => {
    const error = new Error("Erreur volontaire de test.");
    error.statusCode = 418;
    next(error);
  });
}

app.use("/api/auth", authRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/quizzes", quizzesRoutes);
app.use("/api/evaluations", evaluationsRoutes);
app.use("/api/badges", badgesRoutes);
app.use("/api/messages", messagingRoutes);

app.use((req, res, next) => {
  const error = new Error("Route introuvable");
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

module.exports = app;
