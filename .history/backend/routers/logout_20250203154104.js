const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  res.clearCookie("token"); // ลบ Cookie ที่มี JWT
  res.status(200).json({ message: "ออกจากระบบสำเร็จ" });
});

module.exports = router;
