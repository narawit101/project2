const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // ใช้ secure เฉพาะ production
    sameSite: "Strict" // ป้องกันการโจมตี CSRF
  });

  res.status(200).json({ message: "ออกจากระบบสำเร็จ" });
});

module.exports = router;
