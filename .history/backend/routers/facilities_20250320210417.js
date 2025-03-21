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

// เพิ่มสิ่งอำนวยความสะดวกใหม่
// 📌 เพิ่มสิ่งอำนวยความสะดวกใหม่
router.post("/add", async (req, res) => {
  const { fac_name } = req.body;

  if (!fac_name) {
    return res.status(400).json({ error: "Facility name is required" });
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
//เพิ่มพร้อมราคา admin
router.post("/add", async (req, res) => {
  const { fac_name, price } = req.body;

  if (!fac_name || !price) {
    return res.status(400).json({ error: "Facility name and price are required" });
  }

  if (await isFacilityNameDuplicate(fac_name)) {
    return res.status(400).json({ error: "Facility name already exists" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO facilities (fac_name, price) VALUES ($1, $2) RETURNING *",
      [fac_name, price]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error adding facility" });
  }
});

// ตรวจสอบชื่อซ้ำ
router.post("/checkNameDuplicate", async (req, res) => {
  const { fac_name } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM facilities WHERE fac_name = $1",
      [fac_name]
    );
    res.json({ isDuplicate: result.rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: "Database error checking name" });
  }
});


// 📌 แก้ไขสิ่งอำนวยความสะดวก
router.put("/:fac_id", async (req, res) => {
  const { fac_id } = req.params;
  const { fac_name } = req.body;

  if (!fac_name) {
    return res.status(400).json({ error: "Facility name is required" });
  }

  if (await isFacilityNameDuplicate(fac_name)) {
    return res.status(400).json({ error: "Facility name already exists" });
  }

  try {
    const result = await pool.query(
      "UPDATE facilities SET fac_name = $1 WHERE fac_id = $2 RETURNING *",
      [fac_name, fac_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Facility not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error updating facility" });
  }
});

// 📌 ลบสิ่งอำนวยความสะดวก
router.delete("/delete/:fac_id", async (req, res) => {
  const { fac_id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM facilities WHERE fac_id = $1 RETURNING *",
      [fac_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Facility not found" });
    }
    res.json({ message: "Facility deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error deleting facility" });
  }
});

module.exports = router;