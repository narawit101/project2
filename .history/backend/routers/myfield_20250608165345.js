const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");

router.get("/myfields", authMiddleware, async (req, res) => {
  const user_id = req.user.user_id;
  const role = req.user.role;  // ดึง role ของผู้ใช้งานจาก req.user

  try {
    let query = `
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
      WHERE (field.status = 'ผ่านการอนุมัติ' OR field.status = 'รอตรวจสอบ' OR field.status = 'ไม่ผ่านการอนุมัติ'),
      ORDER BY f.field_id DESC;
    `;
    
    // สำหรับ admin ให้ดึงข้อมูลทั้งหมด
    if (role === "admin") {
      query += `ORDER BY field.field_id ASC;`;
    } else if (role === "field_owner") {
      // สำหรับ field_owner ให้กรองด้วย user_id ของตัวเอง
      query += `AND field.user_id = $1 ORDER BY field.field_id ASC;`;
    }

    const values = role === "field_owner" ? [user_id] : []; // ถ้าเป็น field_owner ใส่ user_id เป็นค่าใน values

    const result = await pool.query(query, values); // ส่งคำขอ query ไปที่ฐานข้อมูล
    res.json(result.rows);  // ส่งผลลัพธ์กลับไปที่ client
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Database error fetching fields" });
  }
});

  
module.exports = router;
