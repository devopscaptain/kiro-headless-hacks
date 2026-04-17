const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { connectDB } = require("./db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const productRoutes = require("./routes/products");

const app = express();

// ISSUE: CORS allows all origins in production
app.use(cors());

// ISSUE: No helmet middleware despite being in package.json
app.use(morgan("dev"));
app.use(express.json());

// ISSUE: No rate limiting on any routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);

// ISSUE: Stack traces leaked to client in production
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message,
    stack: err.stack,
  });
});

// ISSUE: Hardcoded port, no graceful shutdown
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});

module.exports = app;
