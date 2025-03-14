const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token =
    (req.cookies?.token) ||
    (req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.split(" ")[1]);

  console.log("🔹 Token ที่ได้รับ:", token); // ✅ ตรวจสอบ Token ที่ถูกส่งมา

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: กรุณาเข้าสู่ระบบ" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log("✅ Decoded Token:", req.user); // ✅ ตรวจสอบค่า user_id และ role ใน Token

    next();
  } catch (error) {
    console.error("❌ JWT Error:", error);
    res.status(403).json({ message: "Token ไม่ถูกต้อง" });
  }
};

module.exports = authMiddleware;
