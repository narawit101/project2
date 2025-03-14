const express = require("express");
const pool = require("../db");
const bcrypt = require("bcrypt");
const router = express.Router();


router.get("/check-duplicate", async (req, res) => {
  const { field, value } = req.query; 

  if (!field || !value) {
    return res.status(400).json({ message: "Field and value are required" }); // ส่งสถานะ 400 หากไม่มีค่า
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
    console.error("Error checking duplicates:", error); // แสดงข้อผิดพลาดใน console
    return res.status(500).json({ message: "Internal server error" }); // ส่งสถานะ 500 พร้อมข้อความ
  }
});

router.post("/", async (req, res) => {
  const { first_name, last_name, email, password, role, user_name } = req.body;
  console.log("Received registration request:", { first_name, last_name, email, role, user_name }); // Log request

  try {
    const emailCheck = await pool.query("SELECT * FROM users WHERE email = $1 OR user_name = $2", [email, user_name]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email or Username already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, email, password, role, user_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [first_name, last_name, email, hashedPassword, role, user_name]
    );

    console.log("User registered successfully:", result.rows[0]); 
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Registration error:", error); 
    res.status(500).json({ message: error.message });
  }
});

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