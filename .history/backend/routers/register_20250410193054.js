const express = require("express");
const pool = require("../db");
const bcrypt = require("bcrypt");
const router = express.Router();
const { Resend } = require('resend'); 
const resend = new Resend(process.env.Resend_API);
const crypto = require('crypto');


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
    // ตรวจสอบอีเมลและชื่อผู้ใช้ซ้ำในระบบ
    const emailCheck = await pool.query("SELECT * FROM users WHERE email = $1 OR user_name = $2", [email, user_name]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email or Username already registered" });
    }

    // แฮชรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);
    function generateNumericOtp(length) {
      const otp = crypto.randomBytes(length).toString('hex').slice(0, length); // ใช้ 'hex' เพื่อให้เป็นตัวเลข
      return otp;
  }
  const otp = generateNumericOtp(6);
    // เพิ่มข้อมูลผู้ใช้ลงในฐานข้อมูล
    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, email, password, role, user_name,verification,status) VALUES ($1, $2, $3, $4, $5, $6, $7,$8) RETURNING *",
      [first_name, last_name, email, hashedPassword, role, user_name,otp,"รอยืนยัน"]
    );

    try {
      const resultEmail = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: "การลงทะเบียน",
        text: `OTP ของคุณคือ: ${otp}`,
        
      });
      
      console.log("อีเมลส่งสำเร็จ:", resultEmail);
    } catch (error) {
      console.log("ส่งอีเมลไม่สำเร็จ:", error);
      return res.status(500).json({ error: "ไม่สามารถส่งอีเมลได้", details: error.message });
    }

    console.log("User registered successfully:", result.rows[0]); 
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error("Registration error:", error); 
    res.status(500).json({ message: error.message });
  }
});

router.post("/verify/:user_id", async (req, res) => {
  const {user_id} = req.params;
  const { otp } = req.body;  

  console.log("user_id" ,user_id, "OTP", otp);
  try {
    const userData = await pool.query("SELECT * FROM users WHERE user_id = $1", [user_id]);

    if (userData.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const checkOtp = userData.rows[0].verification;
    if (checkOtp === otp) {
      await pool.query("UPDATE users SET status = $1 WHERE user_id = $2", ["ตรวจสอบแล้ว", user_id]);
      return res.status(200).json({ message: "ยืนยันสำเร็จ" });
    } else {
      return res.status(400).json({ message: "OTP ไม่ถูกต้อง" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "ไม่สามารถยืนยันได้" });
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