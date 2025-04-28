const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token; // อ่านจาก cookie เท่านั้น

  console.log("Token ที่ได้รับ:", token);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: กรุณาเข้าสู่ระบบ" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log("Decoded Token:", req.user);

    // เช็คว่า Token หมดอายุหรือยัง (เวลาปัจจุบันต้องน้อยกว่า `decoded.exp * 1000`)
    if (Date.now() >= decoded.exp * 1000) {
      return res
        .status(401)
        .json({ message: "Token หมดอายุ กรุณาเข้าสู่ระบบใหม่" });
    }

    next();
  } catch (error) {
    console.error("JWT Error:", error);
    res.status(403).json({ message: "Token ไม่ถูกต้อง" });
  }
};

module.exports = authMiddleware;
