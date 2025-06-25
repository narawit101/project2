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
  console.log("Request protocol:", req.protocol);
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("Hostname:", req.hostname);
  console.log("x-forwarded-proto:", req.headers["x-forwarded-proto"]);
  console.log("User-Agent:", req.headers["user-agent"]); // เพิ่มเพื่อดู device

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

    const expiresIn = 60 * 60 * 5000; // 5 ชั่วโมง

    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_name: user.user_name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "5h" }
    );

    const isProd = process.env.NODE_ENV === "production";
    const isHttps = req.headers["x-forwarded-proto"] === "https";

    // ตรวจจับ mobile device
    const isMobile = /Mobile|Android|iPhone|iPad/.test(
      req.headers["user-agent"]
    );

    console.log("Is Mobile:", isMobile);
    console.log("Is Production:", isProd);
    console.log("Is HTTPS:", isHttps);

    // กำหนด cookie settings ที่แตกต่างกันสำหรับ mobile
    const cookieOptions = {
      httpOnly: true,
      secure: isProd && isHttps,
      maxAge: expiresIn,
    };

    if (isProd && isHttps) {
      // Production HTTPS
      cookieOptions.sameSite = isMobile ? "Lax" : "None";
    } else {
      // Development
      cookieOptions.sameSite = "Lax";
    }

    console.log("Cookie Options:", cookieOptions);

    res.cookie("token", token, cookieOptions);

    // ส่ง token กลับไปด้วยเผื่อ mobile ต้องการใช้ Authorization header
    res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      ...(isMobile && { token: token }), // ส่ง token เฉพาะ mobile
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
});

module.exports = router;
