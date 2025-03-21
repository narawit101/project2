const express = require("express");
const router = express.Router();
const pool = require("../db");

// 📌 ดึงรายการสิ่งอำนวยความสะดวกทั้งหมด
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM facilities");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Database error fetching facilities" });
  }
});

// 📌 ตรวจสอบชื่อสิ่งอำนวยความสะดวกซ้ำ
const isFacilityNameDuplicate = async (fac_name) => {
  const result = await pool.query(
    "SELECT * FROM facilities WHERE fac_name = $1",
    [fac_name]
  );
  return result.rows.length > 0;
};

// 📌 เพิ่มสิ่งอำนวยความสะดวกใหม่
router.post("/add", async (req, res) => {
  const { fac_name } = req.body;

  if (!fac_name) {
    return res.status(400).json({ error: "Facility name is required" });
  }

  if (await isFacilityNameDuplicate(fac_name)) {
    return res.status(400).json({ error: "Facility name already exists" });
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

module.exports = router;