const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ดึงข้อมูลผู้ใช้ทั้งหมด
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT user_id, user_name, first_name, last_name, email, role FROM users");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// แก้ไขข้อมูลผู้ใช้ (admin หรือเจ้าของเท่านั้น)
router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, role } = req.body;
  const currentUser = req.user; 

  try {
    if (currentUser.role !== "admin" && currentUser.user_id !== parseInt(id)) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
    }

    await pool.query(
      "UPDATE users SET first_name = $1, last_name = $2, email = $3, role = $4 WHERE user_id = $5",
      [first_name, last_name, email, role, id]
    );

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🔹 ลบผู้ใช้ (เฉพาะ Admin เท่านั้น)
router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const currentUser = req.user; // ดึงข้อมูลผู้ใช้จาก Token

  try {
    // ✅ ตรวจสอบสิทธิ์: ต้องเป็น Admin เท่านั้น
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

// ตรวจสอบรหัสเดิม
router.post("/:id/check-password", async (req, res) => {
  const { id } = req.params;
  const { currentPassword } = req.body;

  try {
    const result = await pool.query("SELECT password FROM users WHERE user_id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const storedPassword = result.rows[0].password;

    // ตรวจสอบว่ารหัสเดิมถูกต้องหรือไม่
    const isPasswordMatch = await bcrypt.compare(currentPassword, storedPassword);

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "รหัสเดิมไม่ถูกต้อง" });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error checking password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

// อัปเดตรหัสผ่าน
router.put("/:id/change-password", async (req, res) => {
  const { id } = req.params;
  const { password, first_name, last_name, email, role } = req.body;

  try {
    // ตรวจสอบว่า first_name และ last_name ไม่เป็น null หรือ undefined
    if (!first_name || !last_name) {
      return res.status(400).json({ message: "ข้อมูลไม่สมบูรณ์: ชื่อหรือานามสกุลไม่สามารถเป็นค่าว่าง" });
    }

    // เข้ารหัสรหัสใหม่
    const hashedPassword = await bcrypt.hash(password, 10);

    // อัปเดตรหัสผ่านใหม่และข้อมูลผู้ใช้
    const updateResult = await pool.query("UPDATE users SET password = $1, first_name = $2, last_name = $3, email = $4, role = $5 WHERE user_id = $6", [
      hashedPassword,
      first_name,
      last_name,
      email,
      role,
      id,
    ]);

    if (updateResult.rowCount === 0) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้ในการอัปเดต" });
    }

    res.status(200).json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดต" });
  }
});


module.exports = router;
