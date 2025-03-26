const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");


// field

router.get('/myfield', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.user_id;  // ดึง user_id ของผู้ใช้ที่ล็อกอินอยู่
      console.log("📌 API ถูกเรียก: /myfield โดย user_id:", userId);
  
      // ดึงข้อมูลสนามที่เป็นของ user_id ที่ล็อกอิน และต้องมี status เป็น 'ผ่านการอนุมัติ'
      const result = await pool.query(
        SELECT `users.user_id, users.first_name, users.last_name, users.email, field.*
        FROM field 
        INNER JOIN users ON field.user_id = users.user_id
        WHERE field.user_id = $1 AND field.status = 'ผ่านการอนุมัติ'
     ` , [userId]);
  
      console.log("📌 ข้อมูลสนามที่อนุมัติแล้ว:", result.rows);
      res.json(result.rows);
    } catch (error) {
      console.error("❌ Database error fetching approved fields", error);
      res.status(500).json({ error: 'Database error fetching approved fields' });
    }
  });

module.exports = router;
