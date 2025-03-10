const express = require("express");
const { Pool } = require("pg");
const router = express.Router();


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT first_name, last_name, email, role,user_name FROM users");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;