const jwt = require("jsonwebtoken");
const pool = require("../db");

const authMiddleware = async (req, res, next) => {
  let token = null;

  if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: กรุณาเข้าสู่ระบบ" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      "SELECT role FROM users WHERE user_id = $1",
      [decoded.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "ไม่พบผู้ใช้นี้ในระบบ" });
    }

    req.user = {
      ...decoded,
      role: result.rows[0].role,
    };
    console.log("Authenticated user:", req.user);
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token ไม่ถูกต้อง" });
  }
};

module.exports = authMiddleware;
