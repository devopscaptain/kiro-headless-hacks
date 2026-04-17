const express = require("express");
const { query } = require("../db");

const router = express.Router();

// ISSUE: No authentication middleware — anyone can access user data
router.get("/", async (req, res) => {
  try {
    // ISSUE: Returns ALL users with no pagination — will crash on large datasets
    // ISSUE: Selects * including password hashes
    const users = await query("SELECT * FROM users");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    // ISSUE: SQL injection via URL parameter
    const users = await query(
      `SELECT * FROM users WHERE id = ${req.params.id}`
    );

    // ISSUE: No check if user exists — sends undefined
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // ISSUE: No authorization — any user can update any other user
    // ISSUE: Mass assignment — user can set their own role to admin
    // ISSUE: SQL injection
    await query(
      `UPDATE users SET name = '${name}', email = '${email}', role = '${role}' WHERE id = ${req.params.id}`
    );

    res.json({ message: "User updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    // ISSUE: No authorization, no soft delete, no confirmation
    // ISSUE: SQL injection
    await query(`DELETE FROM users WHERE id = ${req.params.id}`);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ISSUE: Unrestricted file upload with no validation
const multer = require("multer");
const upload = multer({ dest: "/tmp/uploads" });

router.post("/:id/avatar", upload.single("avatar"), async (req, res) => {
  // ISSUE: No file type validation — could upload .exe, .sh, etc.
  // ISSUE: No file size limit
  // ISSUE: Path traversal possible via filename
  const filePath = `/uploads/${req.file.originalname}`;
  await query(
    `UPDATE users SET avatar = '${filePath}' WHERE id = ${req.params.id}`
  );
  res.json({ avatar: filePath });
});

module.exports = router;
