const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM facilities");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Database error fetching facilities" });
  }
});

router.post("/add", authMiddleware, async (req, res) => {
  let { fac_name } = req.body;

  if (!fac_name || fac_name.trim() === "") {
    return res.status(400).json({ error: "Facility name is required" });
  }

  fac_name = fac_name.trim();

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

router.delete("/delete/:id", authMiddleware, async (req, res) => {
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

router.put("/update/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  let { fac_name } = req.body;
  fac_name = fac_name?.trim();

  if (!fac_name) {
    return res.status(400).json({ error: "Facility name is required" });
  }

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

router.get("/:field_id", async (req, res) => {
  const { field_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT  ff.field_fac_id,f.fac_id, f.fac_name, ff.fac_price
       FROM field_facilities ff
       INNER JOIN facilities f ON ff.facility_id = f.fac_id
       WHERE ff.field_id = $1`,
      [field_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "No facilities found for this field." });
    }

    res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error fetching facilities" });
  }
});

module.exports = router;
