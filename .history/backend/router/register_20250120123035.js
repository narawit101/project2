const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcrypt'); // สำหรับการแฮชรหัสผ่าน
require('dotenv').config();

// ตั้งค่าการเชื่อมต่อกับ PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Route สำหรับการสมัครสมาชิก (Register)
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // แฮชรหัสผ่านก่อนบันทึกลงฐานข้อมูล
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (first_name, last_name, ) VALUES ($1, $2) RETURNING *',
      [username, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
