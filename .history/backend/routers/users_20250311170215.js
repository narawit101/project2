const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const router = express.Router();

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
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, role } = req.body;

  try {
    await pool.query(
      "UPDATE users SET first_name = $1, last_name = $2, email = $3, role = $4 WHERE user_id = $5",
      [first_name, last_name, email, role, id]
    );
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ลบผู้ใช้ (admin เท่านั้น)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ตรวจสอบรหัสเดิม
router.post("/:id/check-password", async (req, res) => {
  const { id } = req.params;
  const { currentPassword } = req.body;

  try {
    // ดึงข้อมูลรหัสผ่านเก่าจากฐานข้อมูล
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

// เปลี่ยนรหัส
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    // เข้ารหัสรหัสใหม่
    const hashedPassword = await bcrypt.hash(password, 10);

    // อัปเดตรหัสผ่านใหม่
    await pool.query("UPDATE users SET password = $1 WHERE user_id = $2", [hashedPassword, id]);

    res.status(200).json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดต" });
  }
});

module.exports = router;

module.exports = router;
