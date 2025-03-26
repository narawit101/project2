const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");

// ดึงรายการสิ่งอำนวยความสะดวกทั้งหมด
router.get("/",authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM facilities");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Database error fetching facilities" });
  }
});

// เพิ่มสิ่งอำนวยความสะดวกใหม่
router.post("/add",authMiddleware, async (req, res) => {
  const { fac_name } = req.body;

  if (!fac_name) {
    return res.status(400).json({ error: "Facility name is required" });
  }

  // ตรวจสอบชื่อสิ่งอำนวยความสะดวกซ้ำ
  const existingFacility = await pool.query(
    "SELECT * FROM facilities WHERE fac_name = $1",
    [fac_name]
  );

  if (existingFacility.rowCount > 0) {
    return res.status(400).json({ error: "สิ่งอำนวยความสะดวกนี้มีอยู่แล้ว" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO facilities (fac_name) VALUES ($1) RETURNING *",
      [fac_name]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error adding facility" });
  }
});


// ลบสิ่งอำนวยความสะดวก
router.delete("/delete/:id",authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM facilities WHERE fac_id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Facility not found" });
    }

    res.json({ message: "Facility deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error deleting facility" });
  }
});

// แก้ไขชื่อสิ่งอำนวยความสะดวก
router.put("/update/:id",authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { fac_name } = req.body;

  if (!fac_name) {
    return res.status(400).json({ error: "Facility name is required" });
  }

  // ตรวจสอบชื่อสิ่งอำนวยความสะดวกซ้ำ
  const existingFacility = await pool.query(
    "SELECT * FROM facilities WHERE fac_name = $1 AND fac_id != $2",
    [fac_name, id]
  );

  if (existingFacility.rowCount > 0) {
    return res.status(400).json({ error: "สิ่งอำนวยความสะดวกนี้มีอยู่แล้ว" });
  }

  try {
    const result = await pool.query(
      "UPDATE facilities SET fac_name = $1 WHERE fac_id = $2 RETURNING *",
      [fac_name, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Facility not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error updating facility" });
  }
});

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