const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { query } = require("../db");

const router = express.Router();

// ISSUE: Hardcoded JWT secret
const JWT_SECRET = "my-super-secret-jwt-key-do-not-share";

// ISSUE: JWT never expires
const signToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
};

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // ISSUE: No input validation — email format, password strength, name length
    // ISSUE: SQL injection via string interpolation
    const existing = await query(
      `SELECT * FROM users WHERE email = '${email}'`
    );

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // ISSUE: Low salt rounds — should be at least 12
    const hashedPassword = await bcrypt.hash(password, 4);

    // ISSUE: SQL injection again
    await query(
      `INSERT INTO users (email, password, name, role) VALUES ('${email}', '${hashedPassword}', '${name}', 'admin')`
    );

    // ISSUE: New users default to 'admin' role
    const token = signToken({ id: 1, email, role: "admin" });

    // ISSUE: Token sent in response body AND set as non-httponly cookie
    res.cookie("token", token);
    res.status(201).json({ token, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ISSUE: SQL injection
    const users = await query(`SELECT * FROM users WHERE email = '${email}'`);

    if (!users || users.length === 0) {
      // ISSUE: Reveals whether email exists (user enumeration)
      return res.status(401).json({ error: "No account found with this email" });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      // ISSUE: Different error message for wrong password vs wrong email
      return res.status(401).json({ error: "Incorrect password" });
    }

    // ISSUE: No brute force protection, no login attempt tracking
    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ISSUE: No token verification middleware exported for other routes
module.exports = router;
