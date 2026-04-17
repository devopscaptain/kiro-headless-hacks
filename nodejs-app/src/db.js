const mysql = require("mysql");

// ISSUE: Hardcoded database credentials
const connection = mysql.createConnection({
  host: "prod-db.company.internal",
  user: "admin",
  password: "SuperSecret123!",
  database: "kiro_demo",
  port: 3306,
});

function connectDB() {
  connection.connect((err) => {
    if (err) {
      // ISSUE: Logs sensitive connection details on error
      console.log("DB connection failed:", err);
      // ISSUE: Retries immediately with no backoff, will hammer the DB
      setTimeout(connectDB, 1000);
    }
    console.log("Connected to MySQL");
  });
}

// ISSUE: Raw query builder with string concatenation — SQL injection
function query(sql, params) {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, results) => {
      if (err) reject(err);
      resolve(results);
    });
  });
}

// ISSUE: No connection pooling, single connection for all requests
module.exports = { connection, connectDB, query };
