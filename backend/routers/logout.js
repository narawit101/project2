const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
     sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // ปรับค่า sameSite ให้เหมาะกับ env
  });

  res.status(200).json({ message: "ออกจากระบบสำเร็จ" });
});

module.exports = router;
