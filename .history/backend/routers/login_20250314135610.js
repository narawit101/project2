const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const router = express.Router();
router.use(cookieParser());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

router.post("/", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const userQuery = `SELECT * FROM users WHERE user_name = $1 OR email = $1`;
    const userResult = await pool.query(userQuery, [identifier]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // **สร้าง JWT Token**
    const token = jwt.sign(
      {
        user_id: user.id, // ✅ ตรวจสอบว่ามี `user_id`
        user_name: user.user_name,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    

    // **ส่ง JWT ไปยัง Client ผ่าน Cookie**
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 3600000, // 1 ชั่วโมง
    });

    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
});


module.exports = router;
