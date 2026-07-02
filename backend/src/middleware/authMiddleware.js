const jwt = require("jsonwebtoken");

function getTokenFromHeader(req) {
  const authorization = req.headers.authorization || req.headers.Authorization;

  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");

  if (!/^Bearer$/i.test(scheme) || !token) {
    return null;
  }

  return token;
}

function createAuthError(message) {
  const error = new Error(message);
  error.statusCode = 401;

  return error;
}

// Verifie le JWT envoye dans Authorization et attache l'utilisateur a req.user.
function authMiddleware(req, res, next) {
  try {
    if (!process.env.JWT_SECRET) {
      const error = new Error("Configuration JWT manquante.");
      error.statusCode = 500;
      throw error;
    }

    const token = getTokenFromHeader(req);

    if (!token) {
      throw createAuthError("Token d'authentification manquant.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id || decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role,
      tokenPayload: decoded,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      next(createAuthError("Token d'authentification invalide ou expire."));
      return;
    }

    next(error);
  }
}

module.exports = authMiddleware;
module.exports.getTokenFromHeader = getTokenFromHeader;
