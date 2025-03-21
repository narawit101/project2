const express = require("express");
const router = express.Router();
const pool = require("../db"); // ใช้ PostgreSQL connection

// 📌 ดึงประเภทกีฬา
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sports_types");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Database error fetching sports types" });
  }
});

const isSportNameDuplicate = async (sport_name) => {
  const result = await pool.query(
    "SELECT * FROM sports_types WHERE sport_name = $1",
    [sport_name]
  );
  return result.rows.length > 0;
};

// 📌 เพิ่มประเภทกีฬาใหม่
router.post("/add", async (req, res) => {
  const { sport_name } = req.body;

  if (!sport_name) {
    return res.status(400).json({ error: "Sport name is required" });
  }

  if (await isSportNameDuplicate(sport_name)) {
    return res.status(400).json({ error: "Sport name already exists" });
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

// 📌 แก้ไขประเภทกีฬา
router.put("/:sport_id", async (req, res) => {
  const { sport_id } = req.params;
  const { sport_name } = req.body;

  if (!sport_name) {
    return res.status(400).json({ error: "Sport name is required" });
  }

  if (await isSportNameDuplicate(sport_name)) {
    return res.status(400).json({ error: "Sport name already exists" });
  }

  try {
    const result = await pool.query(
      "UPDATE sports_types SET sport_name = $1 WHERE sport_id = $2 RETURNING *",
      [sport_name, sport_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sport type not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Database error updating sport type" });
  }
});

// 📌 ลบประเภทกีฬา
router.delete("/delete/:sport_id", async (req, res) => {
  const { sport_id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM sports_types WHERE sport_id = $1 RETURNING *",
      [sport_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sport type not found" });
    }
    res.json({ message: "Sport type deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error deleting sport type" });
  }
});


module.exports = router;