const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
const pool = require("../db");
const { Resend } = require('resend'); 
const resend = new Resend(process.env.Resend_API);
const crypto = require('crypto');

// ดึงข้อมูลผู้ใช้ทั้งหมด
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้!" });
    }

    const result = await pool.query("SELECT user_id, user_name, first_name, last_name, email, role, status FROM users");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching manager data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// แก้ไขข้อมูลผู้ใช้ (admin หรือเจ้าของเท่านั้น)
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, role } = req.body;
  const currentUser = req.user; 

  console.log("user_id ที่ส่งมา:", id);
  console.log("user_id ใน Token:", currentUser.user_id, "Role:", currentUser.role);

  try {
    //ตรวจสอบว่าเป็น Admin หรือเจ้าของบัญชี
    if (!currentUser.user_id || (parseInt(id) !== currentUser.user_id && currentUser.role !== "admin")) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
    }

    await pool.query(
      "UPDATE users SET first_name = $1, last_name = $2, email = $3, role = $4 WHERE user_id = $5",
      [first_name, last_name, email, role, id]
    );

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🔹 ลบผู้ใช้ (เฉพาะ Admin เท่านั้น)
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const currentUser = req.user; 

  try {
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบผู้ใช้นี้" });
    }

    await pool.query("DELETE FROM users WHERE user_id = $1", [id]);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/check-email", authMiddleware, async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query("SELECT user_id FROM users WHERE email = $1", [email]);

    if (result.rows.length > 0) {
      return res.status(200).json({ exists: true, user_id: result.rows[0].user_id });
    }

    res.status(200).json({ exists: false });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบอีเมล" });
  }
});


// ตรวจสอบรหัสเดิม
router.post("/:id/check-password", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { currentPassword } = req.body;  // รับค่ารหัสเดิมจาก body

  try {
    // ดึงรหัสผ่านที่เก็บไว้ในฐานข้อมูล
    const result = await pool.query("SELECT password FROM users WHERE user_id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const storedPassword = result.rows[0].password;  // รหัสที่เก็บในฐานข้อมูล

    // ตรวจสอบว่ารหัสเดิมตรงกับรหัสที่เก็บในฐานข้อมูลหรือไม่
    const isPasswordMatch = await bcrypt.compare(currentPassword, storedPassword);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "รหัสเดิมไม่ถูกต้อง" });
    }

    res.status(200).json({ success: true });  // ถ้ารหัสตรง
  } catch (error) {
    console.error("Error checking password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

router.post("/check_token", async (req, res) => {
  const {email} = req.body;
  try{
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`,[email]);
    if(result.rows.length === 0){
      return res.status(404).json({message:"ไม่พบผู้ใช้"});
    }
    const user = result.rows[0];
    const user_id = user.user_id;
    const result_otp = await pool.query(`SELECT * FROM password_reset WHERE user_id = $1`,[user_id]);
    res.status(200).json({message:"ดึงข้อมูลผู้ใช้สำเร็จ",otp_data:result_otp})
  }
  catch (error){
    console.error("Error:",error);
    res.status(404).json({message:"ไม่พบผู้ใช้"});
  }
});


router.post("/reset-password", async (req, res) => {
  const {email} = req.body;
  try{
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`,[email]);
    if(result.rows.length === 0){
      return res.status(404).json({message:"ไม่พบผู้ใช้"});
    }
    const user = result.rows[0];
    const user_id = user.user_id;
    function generateNumericOtp(length) {
              const otp = crypto.randomBytes(length).toString('hex').slice(0, length); // ใช้ 'hex' เพื่อให้เป็นตัวเลข
              return otp;
          }
        const otp = generateNumericOtp(6);  // สร้าง OTP ใหม่
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);  // กำหนดเวลาให้ OTP หมดอายุใน 5 นาที
        const otp_reset =await pool.query(`INSERT INTO password_reset (user_id,token,expires_at)VALUES ($1,$2,$3)`,[user_id,otp,otpExpiry]);
          if(otp_reset.rowCount === 0){
            resend.emails.send({
              from:process.env.Sender_Email,
              to:email,
              subject:"OTP reset password",
              text:`รหัส OTP ของคุณคือ ${otp} กรุณาใช้รหัสนี้เพื่อรีเซ็ตรหัสผ่านของคุณ`
            })
          }
    
        res.status(200).json({message:"ส่ง OTP ไปยังอีเมลเรียบร้อยแล้ว"});
  } catch (error){
    console.error("Error:", error);
    res.status(500).json({message:"เกิดข้อผิดพลาด"});
  }
});

router.put("/reset-password", authMiddleware, async (req, res) => {
  const {email} =req.body;
  try{
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`,[email]);
    if(result.rows.length === 0){
      return res.status(404).json({message:"ไม่พบผู้ใช้"});
    }
    const user = result.rows[0];
    const user_id = user.user_id;
    function generateNumericOtp(length) {
              const otp = crypto.randomBytes(length).toString('hex').slice(0, length); // ใช้ 'hex' เพื่อให้เป็นตัวเลข
              return otp;
          }
        const otp = generateNumericOtp(6);  // สร้าง OTP ใหม่
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);  // กำหนดเวลาให้ OTP หมดอายุใน 5 นาที
        const otp_reset = await pool.query(`UPDATE password_reset  SET token = $1, SET expires_at = $2`,[otp,otpExpiry,user_id]);
          if(otp_reset.rowCount === 0){
          resend.emails.send({
            from:process.env.Sender_Email,
            to:email,
            subject:"OTP reset password",
            text:`รหัส OTP ของคุณคือ ${otp} กรุณาใช้รหัสนี้เพื่อรีเซ็ตรหัสผ่านของคุณ`
          })
        }
        res.status(200).json({message:"ส่ง OTP ไปยังอีเมลเรียบร้อยแล้ว"});
  } catch (error){
    console.error("Error:", error);
    res.status(500).json({message:"เกิดข้อผิดพลาด"});
  }
});

// อัปเดตรหัสผ่าน
router.put("/:id/change-password", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;  // ใช้แค่รหัสผ่านใหม่

  try {
    if (!password) {
      return res.status(400).json({ message: "รหัสผ่านใหม่ไม่สามารถเป็นค่าว่าง" });
    }

    // เข้ารหัสรหัสใหม่
    const hashedPassword = await bcrypt.hash(password, 10);

    // อัปเดตรหัสผ่านใหม่
    const updateResult = await pool.query(
      "UPDATE users SET password = $1 WHERE user_id = $2", 
      [hashedPassword, id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้ในการอัปเดต" });
    }

    res.status(200).json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดต" });
  }
});



module.exports = router;
