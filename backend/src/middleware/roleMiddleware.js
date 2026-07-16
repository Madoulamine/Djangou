const VALID_ROLES = Object.freeze({
  ELEVE: "ELEVE",
  ENSEIGNANT: "ENSEIGNANT",
  ADMIN: "ADMIN",
});

function normalizeRoles(roles) {
  return roles.flat().map((role) => String(role).trim().toUpperCase());
}

function createForbiddenError(message) {
  const error = new Error(message);
  error.statusCode = 403;

  return error;
}

// Autorise l'acces uniquement si le role de req.user fait partie des roles permis.
function roleMiddleware(...allowedRoles) {
  const normalizedAllowedRoles = normalizeRoles(allowedRoles);

  return function checkRole(req, res, next) {
    try {
      if (!req.user) {
        const error = new Error("Authentification requise avant la verification du role.");
        error.statusCode = 401;
        throw error;
      }

      const userRole = String(req.user.role || "").trim().toUpperCase();

      if (!userRole || !normalizedAllowedRoles.includes(userRole)) {
        throw createForbiddenError("Acces refuse pour ce role utilisateur.");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = roleMiddleware;
module.exports.authorizeRoles = roleMiddleware;
module.exports.VALID_ROLES = VALID_ROLES;
