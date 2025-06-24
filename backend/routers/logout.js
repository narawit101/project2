const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const isHttps = req.headers["x-forwarded-proto"] === "https";
  console.log("x-forwarded-proto:", req.headers["x-forwarded-proto"]);

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd && isHttps, // ใช้ secure แค่บน production
    sameSite: isProd && isHttps ? "None" : "Lax", // ปรับค่า sameSite ให้เหมาะกับ env
  });

  res.status(200).json({ message: "ออกจากระบบสำเร็จ" });
});

module.exports = router;
