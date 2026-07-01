function getStatusCode(error) {
  if (error.statusCode && Number.isInteger(error.statusCode)) {
    return error.statusCode;
  }

  if (error.status && Number.isInteger(error.status)) {
    return error.status;
  }

  if (error.name === "ValidationError") {
    return 400;
  }

  if (error.name === "JsonWebTokenError") {
    return 401;
  }

  if (error.name === "TokenExpiredError") {
    return 401;
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return 413;
  }

  return 500;
}

function getErrorMessage(error, statusCode) {
  if (error.code === "LIMIT_FILE_SIZE") {
    return "Le fichier envoye depasse la taille autorisee.";
  }

  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    return "Erreur interne du serveur.";
  }

  return error.message || "Une erreur est survenue.";
}

// Centralise toutes les erreurs Express et renvoie une reponse JSON uniforme.
function errorHandler(error, req, res, next) {
  const statusCode = getStatusCode(error);
  const response = {
    success: false,
    message: getErrorMessage(error, statusCode),
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
