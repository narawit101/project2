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

router.get('/myfields', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;  // ดึง user_id ของผู้ใช้ที่ล็อกอินอยู่
    console.log("📌 API ถูกเรียก: /myfield โดย user_id:", userId);

    // ดึงข้อมูลสนามที่เป็นของ user_id ที่ล็อกอิน และต้องมี status เป็น 'ผ่านการอนุมัติ'
    const result = await pool.query(
      SELECT `users.user_id, users.first_name, users.last_name, users.email, field.*
      FROM field 
      INNER JOIN users ON field.user_id = users.user_id
      WHERE field.user_id = $1 AND field.status = 'ผ่านการอนุมัติ'
    `,[userId]);

    console.log("📌 ข้อมูลสนามที่อนุมัติแล้ว:", result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Database error fetching approved fields", error);
    res.status(500).json({ error: 'Database error fetching approved fields' });
  }
});


module.exports = router;