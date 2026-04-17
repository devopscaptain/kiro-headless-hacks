const jwt = require("jsonwebtoken");

// ISSUE: Duplicated secret — should be shared config
const JWT_SECRET = "my-super-secret-jwt-key-do-not-share";

// ISSUE: Middleware exists but is never imported or used in any route
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;

  // ISSUE: Doesn't strip "Bearer " prefix
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // ISSUE: Catches all errors the same way — expired vs invalid vs malformed
    res.status(401).json({ error: "Invalid token" });
  }
};

// ISSUE: Role check doesn't verify token first — can be bypassed
const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ error: "Insufficient permissions" });
    }
  };
};

module.exports = { authenticate, requireRole };
