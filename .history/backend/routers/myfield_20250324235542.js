const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");


// field

router.get("/myfield", authMiddleware, async (req, res) => {
    try {
      // ดึง user_id จาก JWT token
      const user_id = req.user.user_id; // ได้จากการตรวจสอบ JWT token ผ่าน authMiddleware
  
      if (!user_id) {
        return res.status(401).json({ error: "Unauthorized: No user ID" });
      }
  
      const sportId = req.query.sport_id; // ดึง sport_id จาก query string ถ้ามี
  
      // SQL Query สำหรับกรองข้อมูลสนามที่ผ่านการอนุมัติและเป็นของผู้ใช้
      const query = `
        SELECT DISTINCT
          field.field_id,
          field.field_name,
          field.img_field,
          field.open_hours,
          field.close_hours,
          field.open_days,
          sports_types.sport_name
        FROM field
        INNER JOIN sub_field ON field.field_id = sub_field.field_id
        INNER JOIN sports_types ON sub_field.sport_id = sports_types.sport_id
        WHERE field.user_id = $1  -- กรองด้วย user_id
          AND field.status = 'ผ่านการอนุมัติ'
          ${sportId ? `AND sports_types.sport_id = $2` : ''}  -- กรองตาม sport_id ถ้ามี
        ORDER BY field.field_id ASC LIMIT 100;
      `;
  
      const values = sportId ? [user_id, sportId] : [user_id]; // ใช้ user_id และ sportId ถ้ามี
  
      const result = await pool.query(query, values); // ส่งค่าลงใน query
      res.json(result.rows);  // ส่งผลลัพธ์กลับไปที่ client
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Database error fetching approved fields" });
    }
  });

module.exports = router;
