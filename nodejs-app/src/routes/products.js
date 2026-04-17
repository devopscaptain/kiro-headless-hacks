const express = require("express");
const { query } = require("../db");
const _ = require("lodash");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // ISSUE: No pagination, returns entire catalog
    const products = await query("SELECT * FROM products");

    // ISSUE: Using lodash for a simple operation that Array.map handles
    const formatted = _.map(products, (p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      // ISSUE: Floating point arithmetic for currency
      discountedPrice: p.price * 0.9,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;

    // ISSUE: SQL injection via search query parameter
    let sql = `SELECT * FROM products WHERE name LIKE '%${q}%'`;

    if (category) {
      sql += ` AND category = '${category}'`;
    }
    if (minPrice) {
      sql += ` AND price >= ${minPrice}`;
    }
    if (maxPrice) {
      sql += ` AND price <= ${maxPrice}`;
    }

    const products = await query(sql);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, price, description, category } = req.body;

    // ISSUE: No input validation
    // ISSUE: No authentication required to create products
    // ISSUE: SQL injection
    await query(
      `INSERT INTO products (name, price, description, category) VALUES ('${name}', ${price}, '${description}', '${category}')`
    );

    res.status(201).json({ message: "Product created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ISSUE: Expensive operation with no caching
router.get("/stats", async (req, res) => {
  try {
    const products = await query("SELECT * FROM products");

    // ISSUE: N+1 query pattern — fetches reviews for each product individually
    const stats = [];
    for (const product of products) {
      const reviews = await query(
        `SELECT * FROM reviews WHERE product_id = ${product.id}`
      );
      stats.push({
        productId: product.id,
        name: product.name,
        reviewCount: reviews.length,
        // ISSUE: Calculates average in JS instead of SQL
        avgRating:
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
      });
    }

    // ISSUE: O(n²) sort when SQL ORDER BY would suffice
    for (let i = 0; i < stats.length; i++) {
      for (let j = i + 1; j < stats.length; j++) {
        if (stats[j].avgRating > stats[i].avgRating) {
          const temp = stats[i];
          stats[i] = stats[j];
          stats[j] = temp;
        }
      }
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
