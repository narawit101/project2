const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
 // วิธีที่ 1: ลองอ่านจาก Cookie ก่อน (สำหรับ desktop)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log("Token from Cookie:", token ? "Found" : "Not found");
  }
  
  // วิธีที่ 2: ถ้าไม่มีใน Cookie ให้ลองอ่านจาก Authorization header (สำหรับ mobile)
  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // ตัด "Bearer " ออก
      console.log("Token from Header:", token ? "Found" : "Not found");
    }
  }
  
  // วิธีที่ 3: ลองอ่านจาก Body (สำหรับกรณีพิเศษ)
  if (!token && req.body && req.body.token) {
    token = req.body.token;
    console.log("Token from Body:", token ? "Found" : "Not found");
  }
  
  if (!token) {
    console.log("No token found in any method");
    return res.status(401).json({ 
      message: "ไม่พบ token - กรุณาเข้าสู่ระบบใหม่",
      error: "NO_TOKEN"
    });
  }
  
  // ตรวจสอบความถูกต้องของ token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token verification failed:", err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: "Token หมดอายุ - กรุณาเข้าสู่ระบบใหม่",
          error: "TOKEN_EXPIRED"
        });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: "Token ไม่ถูกต้อง - กรุณาเข้าสู่ระบบใหม่",
          error: "INVALID_TOKEN"
        });
      } else {
        return res.status(401).json({ 
          message: "เกิดข้อผิดพลาดในการตรวจสอบ token",
          error: "TOKEN_ERROR"
        });
      }
    }
    
    // เก็บข้อมูล user ไว้ใน req เพื่อใช้ใน route ต่อไป
    req.user = decoded;
    console.log("Token verified successfully for user:", decoded.user_id);
    next();
  });
};

module.exports = authMiddleware;
