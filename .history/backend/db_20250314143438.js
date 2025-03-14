const { Pool } = require("pg"); // ✅ นำเข้า Pool อย่างถูกต้อง
require("dotenv").config(); // ✅ โหลดค่า .env

// ✅ ใช้ Pool แค่ครั้งเดียว และส่งออกไปใช้ใน Router อื่นๆ
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect((err) => {
  if (err) {
    console.error("❌ Database connection error:", err.stack);
  } else {
    console.log("✅ Connected to PostgreSQL database");
  }
});

module.exports = pool; // ✅ ส่งออก `pool` ไปใช้ใน Router อื่นๆ
