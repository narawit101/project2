const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const cookieParser = require("cookie-parser");
const pool = require("../db");
const { Resend } = require("resend");
const resend = new Resend(process.env.Resend_API);
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
router.use(cookieParser());
const { DateTime } = require("luxon");
const rateLimit = require("express-rate-limit");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../server");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = "uploads";
    let resourceType = "auto";
    let format = undefined;
    if (file.fieldname === "user_profile") {
      folder = "user-profile";
      resourceType = "image";
      format = undefined;
    }

    const config = {
      folder: folder,
      resource_type: resourceType,
      public_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    if (format) {
      config.format = format;
      console.log(`กำหนด format เป็น: ${format}`);
    }

    if (resourceType === "image") {
      config.transformation = [
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ];
    }

    return config;
  },
});

const upload = multer({
  storage: storage,
  limits: {
    files: 11,
    fileSize: 8 * 1024 * 1024,
  },
});

async function deleteCloudinaryFile(fileUrl) {
  try {
    console.log("กำลังลบไฟล์:", fileUrl);

    const urlParts = fileUrl.split("/");

    const uploadIndex = urlParts.findIndex((part) => part === "upload");
    if (uploadIndex === -1) {
      console.error("URL ไม่ถูกต้อง - ไม่มี 'upload'");
      return;
    }

    let pathStartIndex = uploadIndex + 1;
    if (urlParts[pathStartIndex] && urlParts[pathStartIndex].startsWith("v")) {
      pathStartIndex++;
    }

    const pathParts = urlParts.slice(pathStartIndex);
    const fullPath = pathParts.join("/");

    const isRawFile = fileUrl.includes("/raw/upload/");
    const isImageFile =
      fileUrl.includes("/image/upload/") ||
      (!fileUrl.includes("/raw/") && !fileUrl.includes("/video/"));

    let publicId, resourceType;

    if (isRawFile) {
      publicId = fullPath;
      resourceType = "raw";
      console.log("ไฟล์เอกสาร (raw):", publicId);
    } else {
      const lastDotIndex = fullPath.lastIndexOf(".");
      publicId =
        lastDotIndex > 0 ? fullPath.substring(0, lastDotIndex) : fullPath;
      resourceType = "image";
      console.log("ไฟล์รูปภาพ:", publicId);
    }

    console.log(`กำลังลบ: ${publicId} (${resourceType})`);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "ok") {
      console.log(`ลบ Cloudinary สำเร็จ: ${publicId}`);
    } else if (result.result === "not found") {
      console.warn(`ไม่พบไฟล์: ${publicId} (${resourceType})`);

      const alternativeType = resourceType === "raw" ? "image" : "raw";
      console.log(`ลองลบด้วย resource_type: ${alternativeType}`);

      const retryResult = await cloudinary.uploader.destroy(publicId, {
        resource_type: alternativeType,
      });

      if (retryResult.result === "ok") {
        console.log(`ลบสำเร็จด้วย ${alternativeType}: ${publicId}`);
      } else {
        console.warn(`ลบไม่สำเร็จทั้งสองแบบ: ${publicId}`, retryResult);
      }
    } else {
      console.warn(`ผลลัพธ์ไม่คาดคิด: ${publicId}`, result);
    }
  } catch (error) {
    console.error("ลบ Cloudinary ไม่สำเร็จ:", error);
  }
}

const LimiterRequestContact = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req, res) => {
    try {
      return req.body.email?.toLowerCase().trim() || req.ip;
    } catch {
      return req.ip;
    }
  },
  handler: (req, res, next, options) => {
    console.warn("Rate limit email เกิน:", {
      email: req.body?.email,
      ip: req.ip,
      path: req.originalUrl,
      time: DateTime.now()
        .setZone("Asia/Bangkok")
        .toFormat("dd/MM/yyyy HH:mm:ss"),
    });

    res.status(429).json({
      code: "RATE_LIMIT",
      message:
        "Email ของคุณส่งคำขอเกินกำหนด (5ครั้ง/ชั่วโมง) กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
    });
  },
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const result = await pool.query(
      "SELECT user_id, user_name, first_name, last_name, email, role, status, created_at,user_profile FROM users WHERE user_id = $1",
      [user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const user = result.rows[0];

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้!" });
    }

    const result =
      await pool.query(`SELECT user_id, user_name, first_name, last_name, email, role, status,user_profile
            FROM users
            ORDER BY 
            CASE role
              WHEN 'admin' THEN 1
              WHEN 'customer' THEN 2
              WHEN 'field_owner' THEN 3
            ELSE 4
            END,
            user_id ASC;
`);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching manager data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, role, status } = req.body;
  const currentUser = req.user;

  console.log("user_id ที่ส่งมา:", id);
  console.log(
    "user_id ใน Token:",
    currentUser.user_id,
    "Role:",
    currentUser.role
  );

  try {
    if (
      !currentUser.user_id ||
      (parseInt(id) !== currentUser.user_id && currentUser.role !== "admin")
    ) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
    }

    await pool.query(
      "UPDATE users SET first_name = $1, last_name = $2, role = $3, status = $4 WHERE user_id = $5",
      [first_name, last_name, role, status, id]
    );
    const result = await pool.query(
      "SELECT user_id, user_name, first_name, last_name, email, role, status FROM users WHERE user_id = $1",
      [id]
    );

    if (req.io) {
      req.io.emit("updated_status", {
        userId: id,
        userRole: result.rows[0].role,
      });
      console.log("ส่งข้อมูลไปยังผู้ใช้ที่เกี่ยวข้อง:", id);
    } else {
      console.log("ไม่พบ req.io เพื่อส่งข้อมูลไปยังผู้ใช้");
    }
    console.log("role", result.rows[0].role);
    console.log("ข้อมูลอัปเดตสำเร็จ:", id);

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put(
  "/update-user-profile/:id",
  upload.fields([{ name: "user_profile", maxCount: 1 }]),
  authMiddleware,
  async (req, res) => {
    const { id } = req.params;
    const currentUser = req.user;

    console.log("user_id ที่ส่งมา:", id);
    console.log("user_id ใน Token:", currentUser.user_id);
    console.log("Files received:", req.files);

    try {
      if (!currentUser.user_id || parseInt(id) !== currentUser.user_id) {
        return res
          .status(403)
          .json({ message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
      }

      if (
        !req.files ||
        !req.files["user_profile"] ||
        req.files["user_profile"].length === 0
      ) {
        return res.status(400).json({ message: "กรุณาเลือกไฟล์รูปภาพ" });
      }

      const oldUserResult = await pool.query(
        "SELECT user_profile FROM users WHERE user_id = $1",
        [id]
      );

      const oldUserProfile = oldUserResult.rows[0]?.user_profile;

      const user_profile = req.files["user_profile"][0].path;
      console.log("Path ของรูปที่อัปโหลด:", user_profile);

      await pool.query(
        "UPDATE users SET user_profile = $1 WHERE user_id = $2",
        [user_profile, id]
      );

      if (oldUserProfile && oldUserProfile.includes("cloudinary.com")) {
        try {
          await deleteCloudinaryFile(oldUserProfile);
          console.log("ลบรูปเก่าสำเร็จ:", oldUserProfile);
        } catch (deleteError) {
          console.error("ไม่สามารถลบรูปเก่าได้:", deleteError);
        }
      }

      console.log("ข้อมูลอัปเดตสำเร็จ");

      res.status(200).json({
        message: "อัปโหลดรูปสำเร็จ",
        user_profile: user_profile,
      });
    } catch (error) {
      console.error("Error in update-user-profile:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "เกิดข้อผิดพลาดในการอัปโหลดรูป",
      });
    }
  }
);

router.put("/update-profile/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name } = req.body;
  const currentUser = req.user;

  console.log("user_id ที่ส่งมา:", id);
  console.log("user_id ใน Token:", currentUser.user_id);
  try {
    if (
      !currentUser.user_id ||
      (parseInt(id) !== currentUser.user_id && currentUser.role !== "admin")
    ) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้" });
    }

    await pool.query(
      "UPDATE users SET first_name = $1, last_name = $2 WHERE user_id = $3",
      [first_name, last_name, id]
    );

    console.log("ข้อมูลอัปเดตสำเร็จ:", first_name, last_name);

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const currentUser = req.user;

  try {
    if (currentUser.role !== "admin") {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบผู้ใช้นี้" });
    }

    await pool.query("DELETE FROM users WHERE user_id = $1", [id]);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/check-email", authMiddleware, async (req, res) => {
  const { email } = req.body;

  try {
    const result = await pool.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length > 0) {
      return res
        .status(200)
        .json({ exists: true, user_id: result.rows[0].user_id });
    }

    res.status(200).json({ exists: false });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบอีเมล" });
  }
});

router.post("/:id/check-password", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { currentPassword } = req.body;

  try {
    const result = await pool.query(
      "SELECT password FROM users WHERE user_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const storedPassword = result.rows[0].password;

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      storedPassword
    );

    if (!isPasswordMatch) {
      return res.status(400).json({ message: "รหัสเดิมไม่ถูกต้อง" });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error checking password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }
    const user = result.rows[0];
    const user_id = user.user_id;

    await pool.query("DELETE FROM password_reset WHERE user_id = $1", [
      user_id,
    ]);

    function generateNumericOtp(length) {
      const otp = crypto.randomBytes(length).toString("hex").slice(0, length);
      return otp;
    }

    const otp = generateNumericOtp(6);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const otp_reset = await pool.query(
      "INSERT INTO password_reset (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user_id, otp, otpExpiry]
    );

    if (otp_reset.rowCount > 0) {
      resend.emails.send({
        from: process.env.Sender_Email,
        to: email,
        subject: "รีเซ็ตรหัสผ่าน",
        html: `
<div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: 10px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; margin-top:80px;box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <img src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926689/logo2small_lzsrwa.png" alt="Sport-Hub Online Logo" style="display: block; max-width: 300px; margin-bottom: 10px;" />
      </td>
    </tr>
  </table>
  <h1 style="color: #03045e; margin-bottom: 16px; text-align: center">รีเซ็ตรหัสผ่าน</h1>
  <h2 style="color: #03045e; margin-bottom: 16px; text-align: center"> OTP ของคุณคือ  <strong style="display: inline-block; font-weight: bold; font-size: 35px; color: #80D8C3;">
    ${otp}
  </strong> </h2>

  <p style="font-size: 16px; text-align: center; color: #9ca3af;">
    <strong> กรุณาใช้รหัสนี้เพื่อรีเซ็ตรหัสผ่านของคุณ</strong>
  </p>
  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="font-size: 12px; color: #9ca3af;text-align: center ">
    หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  </p>
</div>
`,
      });
    }

    res.status(200).json({
      message: "ข้อมูล",
      expiresAt: Date.now() + 60 * 1000 * 10,
      user: {
        user_id: user.user_id,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

router.post("/resent-reset-password", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const user = result.rows[0];
    const user_id = user.user_id;

    await pool.query("DELETE FROM password_reset WHERE user_id = $1", [
      user_id,
    ]);

    function generateNumericOtp(length) {
      const otp = crypto.randomBytes(length).toString("hex").slice(0, length);
      return otp;
    }

    const otp = generateNumericOtp(6);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const otp_reset = await pool.query(
      "INSERT INTO password_reset (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user_id, otp, otpExpiry]
    );

    if (otp_reset.rowCount > 0) {
      resend.emails.send({
        from: process.env.Sender_Email,
        to: email,
        subject: "รีเซ็ตรหัสผ่าน",
        html: `
<div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: 10px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; margin-top:80px;box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <img src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926689/logo2small_lzsrwa.png" alt="Sport-Hub Online Logo" style="display: block; max-width: 300px; margin-bottom: 10px;" />
      </td>
    </tr>
  </table>
  <h1 style="color: #03045e; margin-bottom: 16px; text-align: center">รีเซ็ตรหัสผ่าน</h1>
  <h2 style="color: #03045e; margin-bottom: 16px; text-align: center"> OTP ของคุณคือ  <strong style="display: inline-block; font-weight: bold; font-size: 35px; color: #80D8C3;">
    ${otp}
  </strong> </h2>

  <p style="font-size: 16px; text-align: center; color: #9ca3af;">
    <strong> กรุณาใช้รหัสนี้เพื่อรีเซ็ตรหัสผ่านของคุณ</strong>
  </p>
  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="font-size: 12px; color: #9ca3af;text-align: center ">
    หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  </p>
</div>
`,
      });
    }

    res.status(200).json({
      message: "ข้อมูล",
      expiresAt: Date.now() + 60 * 1000 * 10,
      user: {
        user_id: user.user_id,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }

    const user = result.rows[0];
    const user_id = user.user_id;

    const otpResult = await pool.query(
      "SELECT * FROM password_reset WHERE user_id = $1 AND token = $2",
      [user_id, otp]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ message: "OTP ไม่ถูกต้อง" });
    }

    const otpExpiry = otpResult.rows[0].expires_at;
    if (new Date() > new Date(otpExpiry)) {
      return res.status(400).json({ message: "OTP หมดอายุ กรุณากดขอใหม่" });
    }

    res.status(200).json({ message: "ยืนยัน OTP สำเร็จ" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการยืนยัน OTP" });
  }
});

router.put("/:id/change-password", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    if (!password) {
      return res
        .status(400)
        .json({ message: "รหัสผ่านใหม่ไม่สามารถเป็นค่าว่าง" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updateResult = await pool.query(
      "UPDATE users SET password = $1 WHERE user_id = $2",
      [hashedPassword, id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้ในการอัปเดต" });
    }

    res.status(200).json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดต" });
  }
});

router.put("/:id/change-password-reset", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    if (!password) {
      return res
        .status(400)
        .json({ message: "รหัสผ่านใหม่ไม่สามารถเป็นค่าว่าง" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updateResult = await pool.query(
      "UPDATE users SET password = $1 WHERE user_id = $2",
      [hashedPassword, id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้ในการอัปเดต" });
    }

    res.status(200).json({ message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดต" });
  }
});

router.post("/contact-admin", LimiterRequestContact, async (req, res) => {
  const { email, subJect, conTent } = req.body;

  try {
    const data = await resend.emails.send({
      from: process.env.Sender_Email,
      to: process.env.Owner_Email,
      subject: subJect,
      html: `
       <div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: 10px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; margin-top:80px;box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <img src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926689/logo2small_lzsrwa.png" alt="Sport-Hub Online Logo" style="display: block; max-width: 300px; margin-bottom: 10px;" />
      </td>
    </tr>
  </table>
  <h1 style="color: #03045e; margin-bottom: 16px; text-align: center">
    <p><strong>เรื่อง:</strong> ${subJect}</p>
  </h1>
  <h2 style="color: #03045e; margin-bottom: 16px; text-align: center">
    <p><strong>จาก:</strong> ${email}
</p><strong style="  font-weight: bold;
 ;  font-size: 24px;color: #333;
">
      <p>${conTent}</p>
    </strong>
  </h2>
  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="font-size: 12px; color: #9ca3af;text-align: center ">
    หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  </p>
</div>
      `,
      reply_to: email,
    });

    console.log("Email sent successfully:", data);
    res.status(200).json({
      message: `ส่งคำขอเรียบร้อย กรุณารอข้อความตอบกลับจากผู้ดูแลระบบที่ ${email}`,
    });
  } catch (error) {
    console.error("Resend Error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการส่ง email" });
  }
});

module.exports = router;
