const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");

router.get("/myfields", authMiddleware, async (req, res) => {
    const { user_id } = req.user; // ดึง user_id จาก JWT token
    const sportId = req.query.sport_id; // ดึง sport_id จาก query string (ถ้ามี)
  
    try {
      const query = `
        SELECT DISTINCT
          users.user_id,
          users.first_name,
          users.last_name,
          users.email,
          field.field_id,
          field.field_name,
          field.img_field
        FROM field
        INNER JOIN users ON field.user_id = users.user_id
        WHERE field.user_id = $1  -- กรองด้วย user_id
          AND field.status = 'ผ่านการอนุมัติ'
          ${user_id}  -- กรองตาม sport_id ถ้ามี
        ORDER BY field.field_id ASC
        LIMIT 100;
      `;
  
      const values = sportId ? [user_id, sportId] : [user_id]; // กำหนดพารามิเตอร์ให้กับ query
  
      const result = await pool.query(query, values); // ส่งคำขอ query ไปที่ฐานข้อมูล
      res.json(result.rows);  // ส่งผลลัพธ์กลับไปที่ client
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Database error fetching approved fields" });
    }
  });
  

module.exports = router;
