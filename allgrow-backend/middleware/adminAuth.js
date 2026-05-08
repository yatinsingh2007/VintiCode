const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Admin Authentication Middleware
 * Verifies the admin JWT token from the admin_token cookie.
 * Uses a separate JWT secret (ADMIN_JWT_SECRET) from the user JWT secret.
 */
const checkAdminAuthentication = (req, res, next) => {
  const token = req.cookies.admin_token;

  if (!token) {
    return res.status(401).json({ error: "Admin access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    // Validate the token contains the admin role marker
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: "Forbidden. Not an admin token." });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Admin session expired. Please log in again." });
    }
    return res.status(401).json({ error: "Invalid admin token." });
  }
};

module.exports = { checkAdminAuthentication };
