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

// 📌 เพิ่มประเภทกีฬาใหม่
router.post("/add", async (req, res) => {
  const { sport_name } = req.body;
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

module.exports = router;