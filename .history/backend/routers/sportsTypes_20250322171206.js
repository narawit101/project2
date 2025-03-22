const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");

// ดึงประเภทกีฬา
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sports_types");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Database error fetching sports types" });
  }
});

// เพิ่มประเภทกีฬาใหม่
router.post("/add", authMiddleware, async (req, res) => {
  const { sport_name } = req.body;

  if (!sport_name) {
    return res.status(400).json({ error: "Sport name is required" });
  }

  // ตรวจสอบชื่อประเภทกีฬาซ้ำ
  const existingSportType = await pool.query(
    "SELECT * FROM sports_types WHERE sport_name = $1",
    [sport_name]
  );

  if (existingSportType.rowCount > 0) {
    return res.status(400).json({ error: "ประเภทกีฬานี้มีอยู่แล้ว" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO sports_types (sport_name) VALUES ($1) RETURNING *",
      [sport_name]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error adding sports type" });
  }
});

// ลบประเภทกีฬา
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM sports_types WHERE sport_id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sport type not found" });
    }

    res.json({ message: "Sport type deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error deleting sport type" });
  }
});

// แก้ไขชื่อประเภทกีฬา
router.put("/update/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { sport_name } = req.body;

  if (!sport_name) {
    return res.status(400).json({ error: "Sport name is required" });
  }

  // ตรวจสอบชื่อประเภทกีฬาซ้ำ
  const existingSportType = await pool.query(
    "SELECT * FROM sports_types WHERE sport_name = $1 AND sport_id != $2",
    [sport_name, id]
  );

  if (existingSportType.rowCount > 0) {
    return res.status(400).json({ error: "ประเภทกีฬานี้มีอยู้แล้ว" });
  }

  try {
    const result = await pool.query(
      "UPDATE sports_types SET sport_name = $1 WHERE sport_id = $2 RETURNING *",
      [sport_name, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sport type not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error updating sport type" });
  }
});

// ดึงข้อมูลประเภทกีฬาและสนามที่ผ่านการอนุมัติ
router.get("/preview", async (req, res) => {
  try {
    const result = await pool.query(`
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
      WHERE field.status = 'ผ่านการอนุมัติ'
      ORDER BY field.field_id ASC
      LIMIT 10;
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Database error fetching approved fields" });
  }
});


module.exports = router;
