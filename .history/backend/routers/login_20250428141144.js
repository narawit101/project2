const express = require("express");
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const router = express.Router();
router.use(cookieParser());



router.post("/", async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const userQuery = `SELECT * FROM users WHERE user_name = $1 OR email = $1`;
    const userResult = await pool.query(userQuery, [identifier]);

    if (userResult.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }
    
    //session หมดอายุใน 5 ชั้วโมง ต้อง login ใหม่
    const expiresIn = 60*60*5; 

    // **สร้าง JWT Token**
    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_name: user.user_name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );
    
    // **ส่ง JWT ไปยัง Client ผ่าน Cookie**
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: expiresIn,
    });

    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      expiresAt: Date.now() + expiresIn,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
});

module.exports = router;
