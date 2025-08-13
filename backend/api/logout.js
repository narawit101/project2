const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  const isHttps = req.headers["x-forwarded-proto"] === "https";

  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd && isHttps,
    sameSite: isProd && isHttps ? "None" : "Lax",
    ...(isProd && { domain: ".sporthub-online.me" }),
  });

  res.status(200).json({ message: "ออกจากระบบสำเร็จ" });
});

module.exports = router;
