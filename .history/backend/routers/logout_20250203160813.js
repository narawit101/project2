const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  // ลบ JWT token cookie
  res.clearCookie("token", {
    httpOnly: true, // ป้องกันการเข้าถึงจาก JavaScript
    secure: process.env.NODE_ENV === "production", // ใช้เฉพาะใน production
    sameSite: "Strict" // ป้องกัน CSRF
  });

  res.status(200).json({ message: "ออกจากระบบสำเร็จ" });
});

module.exports = router;
