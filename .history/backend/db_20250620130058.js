const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // สำคัญมากสำหรับ Railway
  },
});

pool.connect((err) => {
  if (err) {
    console.error("Database connection error:", err.stack);
  } else {
    console.log("✅ Connected to PostgreSQL database");
  }
});

module.exports = pool;
