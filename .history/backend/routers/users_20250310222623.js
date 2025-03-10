const express = require("express");
const { Pool } = require("pg");
const router = express.Router();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ดึงข้อมูลผู้ใช้ทั้งหมด
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT user_id, user_name, first_name, last_name, email, role FROM users");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// แก้ไขข้อมูลผู้ใช้ (admin หรือเจ้าของเท่านั้น)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, role } = req.body;

  try {
    await pool.query(
      "UPDATE users SET first_name = $1, last_name = $2, email = $3, role = $4 WHERE user_id = $5",
      [first_name, last_name, email, role, id]
    );
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ลบผู้ใช้ (admin เท่านั้น)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
