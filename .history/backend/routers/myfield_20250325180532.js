const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");

router.get("/myfields", authMiddleware, async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const query = `
      SELECT DISTINCT
        users.user_id,
        users.first_name,
        users.last_name,
        users.email,
        field.field_id,
        field.field_name,
        field.img_field,
        field.status
      FROM field
      INNER JOIN users ON field.user_id = users.user_id
      WHERE field.user_id = $1  -- กรองด้วย user_id
        AND (field.status = 'ผ่านการอนุมัติ' OR field.status = 'รอตรวจสอบ' OR field.status = 'ไม่ผ่านการอนุมัติ')  -- รวมสถานะที่รอตรวจสอบและไม่ผ่าน
      ORDER BY field.field_id ASC;
    `;

    // กำหนดค่าพารามิเตอร์ให้กับ query
    const values = [user_id];

    const result = await pool.query(query, values); // ส่งคำขอ query ไปที่ฐานข้อมูล
    res.json(result.rows);  // ส่งผลลัพธ์กลับไปที่ client
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Database error fetching fields" });
  }
});

  
module.exports = router;
