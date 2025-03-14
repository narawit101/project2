const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // ✅ ดึง Token จาก Cookie หรือ Header
  const token =
    (req.cookies?.token) ||
    (req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.split(" ")[1]);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: กรุณาเข้าสู่ระบบ" });
  }

  try {
    // ✅ ตรวจสอบว่า Token ถูกต้องหรือไม่
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log("Authenticated User:", req.user); 

    next();
  } catch (error) {
    console.error("JWT Error:", error);
    res.status(403).json({ message: "Token ไม่ถูกต้อง" });
  }
};

module.exports = authMiddleware;
