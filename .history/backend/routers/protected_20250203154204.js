const express = require("express");
const authMiddleware = require("../middlewares/auth");
const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  res.json({ message: `สวัสดี ${req.user.user_name}, คุณมีสิทธิ์เข้าถึง API นี้!` });
});

module.exports = router;
