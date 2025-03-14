const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // ✅ ตรวจสอบว่ามี `cookies` และ `Authorization Header` หรือไม่
  const token =
    (req.cookies && req.cookies.token) ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);

  // ❌ ถ้าไม่มี Token -> ส่ง 401 Unauthorized
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: กรุณาเข้าสู่ระบบ" });
  }

  try {
    // ✅ ตรวจสอบว่า Token ถูกต้องหรือไม่
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // ส่งไปยัง API ถัดไป
  } catch (error) {
    res.status(403).json({ message: "Token ไม่ถูกต้อง" });
  }
};

module.exports = authMiddleware;
