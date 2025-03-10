const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const router = express.Router();


const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

router.post("/", async (req, res) => {
  const { first_name, last_name, email, password, role, user_name } = req.body;
  console.log("Received registration request:", { first_name, last_name, email, role, user_name }); // Log request

  try {
    // Check if email or user_name already exists
    const emailCheck = await pool.query("SELECT * FROM users WHERE email = $1 OR user_name = $2", [email, user_name]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email or Username already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, email, password, role, user_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [first_name, last_name, email, hashedPassword, role, user_name]
    );

    console.log("User registered successfully:", result.rows[0]); // Log success
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Registration error:", error); // Log error details
    res.status(500).json({ message: error.message });
  }
});
// 
router.get("/check-duplicate", async (req, res) => {
  const { field, value } = req.query;

  if (!field || !value) {
    return res.status(400).json({ message: "Field and value are required" });
  }

  try {
    const query = `SELECT * FROM users WHERE ${field} = $1`;
    const result = await pool.query(query, [value]);

    if (result.rows.length > 0) {
      return res.status(200).json({ isDuplicate: true });
    } else {
      return res.status(200).json({ isDuplicate: false });
    }
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;