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
router.get("/check-duplicate", async (req, res) => {
  const { field, value } = req.query;

  // ตรวจสอบว่าฟิลด์นั้นเป็นฟิลด์ที่อนุญาต
  const allowedFields = ["user_name", "email"];
  if (!field || !value || !allowedFields.includes(field)) {
    return res.status(400).json({ message: "Invalid field or value" });
  }

  try {
    const query = `SELECT ${field} FROM users WHERE ${field} = $1`;
    const result = await pool.query(query, [value]);

    return res.status(200).json({ isDuplicate: result.rowCount > 0 });
  } catch (error) {
    console.error("Error checking duplicates:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


router.post("/", async (req, res) => {
  const { first_name, last_name, email, password, role, user_name } = req.body;

  // ตรวจสอบข้อมูลที่ส่งมาจากผู้ใช้
  if (!first_name || !last_name || !email || !password || !role || !user_name) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // ตรวจสอบว่ามี email หรือ user_name ซ้ำหรือไม่
    const emailCheck = await pool.query(
      "SELECT 1 FROM users WHERE email = $1 OR user_name = $2",
      [email, user_name]
    );
    if (emailCheck.rowCount > 0) {
      return res.status(400).json({ message: "Email or Username already registered" });
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // เพิ่มข้อมูลผู้ใช้
    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, email, password, role, user_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, email, role, user_name",
      [first_name, last_name, email, hashedPassword, role, user_name]
    );

    res.status(201).json({ message: "User registered successfully", user: result.rows[0] });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
