const { Pool } = require("pg");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.connect((err) => {
  if (err) {
    console.error("❌ Database connection error:", err.stack);
  } else {
    console.log("✅ Connected to PostgreSQL database");
    console.log("🌐 DATABASE_URL = ", process.env.DATABASE_URL);

  }
});

module.exports = pool;
