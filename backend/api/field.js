const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");
const { Resend } = require("resend");
require("dotenv").config();
const resend = new Resend(process.env.Resend_API);
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../server");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = "uploads";
    let resourceType = "auto"; // ค่าเริ่มต้น
    let format = undefined; // ปล่อยให้ Cloudinary จัดการ

    // กำหนด folder ตามประเภทไฟล์
    if (file.fieldname === "documents") {
      folder = "documents";

      // แยกประเภท resource_type ตาม mimetype
      if (file.mimetype.startsWith("image/")) {
        resourceType = "image"; // รูปภาพ - ดูได้ใน Cloudinary
        format = undefined; // ปล่อยให้ Cloudinary optimize
      } else if (file.mimetype === "application/pdf") {
        resourceType = "raw";
        format = "pdf"; // แปลง PDF page แรกเป็น JPG
      } else {
        resourceType = "raw"; // ไฟล์อื่นๆ เช่น doc, docx
        format = file.mimetype.split("/")[1];
      }
    } else if (file.fieldname === "img_field") {
      folder = "field-profile";
      resourceType = "image"; // รูปโปรไฟล์สนาม
      format = undefined; // ปล่อยให้ Cloudinary optimize
    }

    const config = {
      folder: folder,
      resource_type: resourceType,
      public_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // เพิ่ม format เฉพาะเมื่อจำเป็น
    if (format) {
      config.format = format;
      console.log(`กำหนด format เป็น: ${format}`);
    }

    // เพิ่มการ optimize สำหรับรูปภาพ
    if (resourceType === "image") {
      config.transformation = [
        { quality: "auto:good" }, // ปรับคุณภาพอัตโนมัติ
        { fetch_format: "auto" }, // เลือกฟอร์แมตที่เหมาะสม
      ];
    }

    return config;
  },
});

// รองรับการอัปโหลด **หลายไฟล์**
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

    // แยก URL เพื่อหา public_id
    const urlParts = fileUrl.split("/");

    // หา index ของ upload
    const uploadIndex = urlParts.findIndex((part) => part === "upload");
    if (uploadIndex === -1) {
      console.error("URL ไม่ถูกต้อง - ไม่มี 'upload'");
      return;
    }

    // ข้าม version (v1234567890) หากมี
    let pathStartIndex = uploadIndex + 1;
    if (urlParts[pathStartIndex] && urlParts[pathStartIndex].startsWith("v")) {
      pathStartIndex++;
    }

    // รวม folder และ filename
    const pathParts = urlParts.slice(pathStartIndex);
    const fullPath = pathParts.join("/");

    // ตรวจสอบว่าเป็น raw หรือ image จาก URL
    const isRawFile = fileUrl.includes("/raw/upload/");
    const isImageFile =
      fileUrl.includes("/image/upload/") ||
      (!fileUrl.includes("/raw/") && !fileUrl.includes("/video/"));

    let publicId, resourceType;

    if (isRawFile) {
      // สำหรับไฟล์ raw ไม่ต้องตัดนามสกุล
      publicId = fullPath;
      resourceType = "raw";
      console.log("ไฟล์เอกสาร (raw):", publicId);
    } else {
      // สำหรับไฟล์รูปภาพ ต้องตัดนามสกุลออก
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

      // ลองเปลี่ยน resource_type
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

// ฟังก์ชันช่วยสำหรับตรวจสอบและลบไฟล์หลายๆ ไฟล์
async function deleteMultipleCloudinaryFiles(fileUrls) {
  if (!fileUrls || fileUrls.length === 0) {
    console.log("ℹไม่มีไฟล์ที่ต้องลบ");
    return;
  }

  console.log(`กำลังลบไฟล์ ${fileUrls.length} ไฟล์`);

  for (const url of fileUrls) {
    if (url && url.trim()) {
      await deleteCloudinaryFile(url.trim());
      // หน่วงเวลาเล็กน้อยเพื่อไม่ให้ API ถูก rate limit
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

router.post(
  "/register",
  upload.fields([
    { name: "documents", maxCount: 10 },
    { name: "img_field", maxCount: 1 },
  ]),
  authMiddleware,
  async (req, res) => {
    try {
      const {
        user_id,
        field_name,
        address,
        gps_location,
        open_hours,
        close_hours,
        number_bank,
        account_holder,
        price_deposit,
        name_bank,
        status,
        selectedFacilities,
        subFields,
        open_days,
        field_description,
        cancel_hours,
      } = JSON.parse(req.body.data);

      // ตรวจสอบว่ามีไฟล์เอกสารอัปโหลดหรือไม่
      const documents = req.files["documents"]
        ? req.files["documents"]
            .map((file) => file.path.replace(/\\/g, "/"))
            .join(", ") // คลีนพาธแล้วคั่นด้วย ", "
        : [];

      const imgField =
        req.files["img_field"] && req.files["img_field"].length > 0
          ? req.files["img_field"][0].path
          : null;

      // ตรวจสอบว่าเอกสารได้รับการอัปโหลดหรือไม่
      if (documents.length === 0) {
        return res.status(400).send({ error: "กรุณาอัปโหลดเอกสาร" });
      }

      const fieldResult = await pool.query(
        `INSERT INTO field (user_id, field_name, address, gps_location, open_hours, close_hours, number_bank, account_holder, price_deposit, name_bank, documents, img_field, status, open_days, field_description,cancel_hours ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,$16) RETURNING field_id`,
        [
          user_id,
          field_name,
          address,
          gps_location,
          open_hours,
          close_hours,
          number_bank,
          account_holder,
          price_deposit,
          name_bank,
          documents,
          imgField,
          status || "รอตรวจสอบ",
          open_days,
          field_description,
          cancel_hours,
        ]
      );

      const field_id = fieldResult.rows[0].field_id;

      // INSERT ข้อมูลสนามย่อย
      for (const sub of subFields) {
        const subFieldResult = await pool.query(
          `INSERT INTO sub_field (field_id, sub_field_name, price, sport_id, user_id,wid_field,length_field,players_per_team,field_surface) 
         VALUES ($1, $2, $3, $4, $5, $6, $7 ,$8, $9) RETURNING sub_field_id`,
          [
            field_id,
            sub.name,
            sub.price,
            sub.sport_id,
            user_id,
            sub.wid_field,
            sub.length_field,
            sub.players_per_team,
            sub.field_surface,
          ]
        );
        const sub_field_id = subFieldResult.rows[0].sub_field_id;
        // เพิ่ม add_on ที่เกี่ยวข้องกับ sub_field
        for (const addon of sub.addOns) {
          await pool.query(
            `INSERT INTO add_on (sub_field_id, content, price) VALUES ($1, $2, $3) RETURNING add_on_id`,
            [sub_field_id, addon.content, addon.price]
          );
        }
      }

      // INSERT ข้อมูลสิ่งอำนวยความสะดวก
      for (const facId in selectedFacilities) {
        await pool.query(
          `INSERT INTO field_facilities (field_id, facility_id, fac_price) 
         VALUES ($1, $2, $3)`,
          [field_id, facId, selectedFacilities[facId]]
        );
      }
      // ดึงข้อมูลผู้ใช้ (รวมถึง user_email)
      const userData = await pool.query(
        "SELECT * FROM users WHERE user_id = $1",
        [user_id]
      );

      // สมมุติว่าในตาราง users มีคอลัมน์ชื่อ user_email
      const userEmail = userData.rows[0].email; // << ใช้ค่านี้ส่งอีเมล
      const userfirstName = userData.rows[0].first_name; // << ใช้ค่านี้ส่งอีเมล

      // ส่งอีเมล
      try {
        const userEmailResult = await resend.emails.send({
          from: process.env.Sender_Email,
          to: userEmail, // ใช้ค่าที่ดึงมา
          subject: "การลงทะเบียนสนาม",
          html: `

<div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: 10px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; margin-top:80px;box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); text-align:center;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <img src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926689/logo2small_lzsrwa.png" alt="Sport-Hub Online Logo" style="display: block; max-width: 300px; margin-bottom: 10px;" />
      </td>
    </tr>
  </table>
  <h1 style="color: #03045e; margin-bottom: 16px; text-align: center">การลงทะเบียนสนาม</h1>

  <p style="font-size: 16px; text-align: center; color: #9ca3af;">
    <strong>คุณได้ลงทะเบียนสามเรียบร้อยแล้ว </br >กรุณารอผู้ดูแลระบบตรวจสอบ ขอบคุณที่ใช้บริการ</strong>
  </p>
  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="font-size: 12px; color: #9ca3af;text-align: center ">
    หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  </p>
</div>`,
        });
        const adminEmailResult = await resend.emails.send({
          from: process.env.Sender_Email,
          to: process.env.Owner_Email,
          subject: "มีการลงทะเบียนสนามกีฬาใหม่",
          html: `
      <div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: 10px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; margin-top:80px;box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); text-align:center;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <img src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926689/logo2small_lzsrwa.png" alt="Sport-Hub Online Logo" style="display: block; max-width: 300px; margin-bottom: 10px;" />
      </td>
    </tr>
  </table>
  <h1 style="color: #03045e; margin-bottom: 16px;">การลงทะเบียนสนาม</h1>

  <p style="font-size: 16px; color: #111827;">
    <strong style="color: #0f172a;">

    </strong>
  <p style="font-size: 20px;">
  <h3>${userfirstName}</h3>
  ได้ลงทะเบียนสนามกีฬา
  </p>
  </p>

  <div style="margin: 20px 0;">
    <a href="${process.env.FONT_END_URL}/login?redirect=/check-field/${field_id}" style="display: inline-block; background-color: #03045e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;
                 width:160px;" target="_blank">
      ตรวจสอบสนามกีฬา #${field_id}
    </a>
  </div>

  <p style="font-size: 14px; color: #6b7280;">
    กรุณาตรวจสอบและอัปเดตสถานะให้เสร็จสิ้น
  </p>

  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="font-size: 12px; color: #9ca3af;">
    หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  </p>
</div>
      `,
        });

        console.log("Email to user:", userEmailResult);
        console.log("Email to admin:", adminEmailResult);
      } catch (error) {
        console.log("ส่งอีเมลไม่สำเร็จ:", error);
        return res
          .status(500)
          .json({ error: "ไม่สามารถส่งอีเมลได้", details: error.message });
      }
      res.status(200).send({ message: "ลงทะเบียนสนามเรียบร้อย!", field_id });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({ error: "เกิดข้อผิดพลาดในการลงทะเบียนสนาม" });
    }
  }
);

router.put("/appeal/:field_id", authMiddleware, async (req, res) => {
  try {
    const { field_id } = req.params; // รับ field_id จาก URL params
    const { status } = req.body; // รับ status ที่จะอัปเดตจาก body
    const { user_id, role } = req.user; // ดึงข้อมูลจาก token เพื่อเช็ค role ของผู้ใช้

    // ตรวจสอบว่า status ที่ส่งมาถูกต้องหรือไม่ (ต้องเป็น "รออนุมัติ")
    if (status !== "รอตรวจสอบ") {
      return res.status(400).json({ error: "สถานะที่ส่งมาไม่ถูกต้อง" });
    }

    console.log("field_id ที่ได้รับ:", field_id);
    console.log("ข้อมูลที่ได้รับจาก Frontend:", req.body);

    // ตรวจสอบว่า field_id ถูกต้อง
    if (!field_id || isNaN(field_id)) {
      console.log("field_id ไม่ถูกต้อง");
      return res.status(400).json({ error: "field_id ไม่ถูกต้อง" });
    }

    // ตรวจสอบว่า user เป็นเจ้าของสนามหรือ admin หรือไม่
    const checkField = await pool.query(
      "SELECT * FROM field WHERE field_id = $1",
      [field_id]
    );
    console.log("ข้อมูลจากฐานข้อมูล:", checkField.rows);

    if (checkField.rows.length === 0) {
      console.log("ไม่พบข้อมูลสนามกีฬาในฐานข้อมูล");
      return res.status(404).json({ error: "ไม่พบข้อมูลสนามกีฬา" });
    }

    const fieldOwnerId = checkField.rows[0].user_id; // user_id ของเจ้าของสนาม
    const fieldName = checkField.rows[0].field_name; // ชื่อสนาม

    // ถ้าผู้ใช้ไม่ใช่ admin และไม่ใช่เจ้าของสนาม จะไม่อนุญาตให้เปลี่ยนแปลง
    if (role !== "admin" && user_id !== fieldOwnerId) {
      return res
        .status(403)
        .json({ error: "คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลนี้" });
    }

    // อัปเดตสถานะของสนามให้เป็น "รออนุมัติ"
    const result = await pool.query(
      `UPDATE field 
       SET status = $1  -- อัปเดตสถานะ
       WHERE field_id = $2 
       RETURNING *;`,
      [status, field_id]
    );

    console.log("ข้อมูลอัปเดตสำเร็จ:", result.rows[0]);

    try {
      const data = await resend.emails.send({
        from: process.env.Sender_Email,
        to: process.env.Owner_Email,
        subject: "มีการส่งลงทะเบียนสนามกีฬาอีกครั้ง",
        html: `
<div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: 10px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; margin-top:80px;box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); text-align:center;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <img src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926689/logo2small_lzsrwa.png" alt="Sport-Hub Online Logo" style="display: block; max-width: 300px; margin-bottom: 10px;" />
      </td>
    </tr>
  </table>
  <h1 style="color: #03045e; margin-bottom: 16px;">คำขอลงทะเบียนสนามกีฬาอีกครั้ง</h1>

  <p style="font-size: 16px; color: #111827;">
    <strong style="color: #0f172a;">
      <h3>สนาม ${fieldName}</h3>
    </strong>
  <p style="font-size: 18px;">ได้ส่งคำขอลงทะเบียนสนามกีฬาอีกครั้ง</p>
  </p>

  <div style="margin: 20px 0;">
    <a href="${process.env.FONT_END_URL}/login?redirect=/check-field/${field_id}" style="display: inline-block; background-color: #03045e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;
                 width:160px;" target="_blank">
      ตรวจสอบสนามกีฬา #${field_id}
    </a>
  </div>

  <p style="font-size: 14px; color: #6b7280;">
    กรุณาตรวจสอบและอัปเดตสถานะให้เสร็จสิ้น
  </p>

  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="font-size: 12px; color: #9ca3af;">
    หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  </p>
</div><div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: 10px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; margin-top:80px;box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); text-align:center;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <img src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926689/logo2small_lzsrwa.png" alt="Sport-Hub Online Logo" style="display: block; max-width: 300px; margin-bottom: 10px;" />
      </td>
    </tr>
  </table>
  <h1 style="color: #03045e; margin-bottom: 16px;">คำขอแก้ไขสนามกีฬา</h1>

  <p style="font-size: 16px; color: #111827;">
    <strong style="color: #0f172a;">
      <h3>${fieldName}</h3>
    </strong>
  <p style="font-size: 18px;">ได้ส่งคำขอแก้ไขสนามกีฬา</p>
  </p>

  <div style="margin: 20px 0;">
    <a href="${process.env.FONT_END_URL}/login?redirect=/check-field/${field_id}" style="display: inline-block; background-color: #03045e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;
                 width:160px;" target="_blank">
      ตรวจสอบสนามกีฬา #${field_id}
    </a>
  </div>

  <p style="font-size: 14px; color: #6b7280;">
    กรุณาตรวจสอบและอัปเดตสถานะให้เสร็จสิ้น
  </p>

  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="font-size: 12px; color: #9ca3af;">
    หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  </p>
</div>
      `,
      });

      console.log("Email sent successfully:", data);

      return res.status(200).json({
        message: "อัปเดตสถานะสำเร็จและส่งคำขอแก้ไขไปยังผู้ดูแลระบบ",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Resend Error:", error);
      return res.status(500).json({
        message: "อัปเดตสำเร็จแต่ส่ง email ไม่สำเร็จ",
        data: result.rows[0],
        emailError: error.message,
      });
    }
  } catch (error) {
    console.error("Database Error:", error);
    return res.status(500).json({
      error: "เกิดข้อผิดพลาดในการอัปเดตสนามกีฬา",
      details: error.message,
    });
  }
});

router.get("/:field_id", authMiddleware, async (req, res) => {
  try {
    const { field_id } = req.params;
    const { user_id, role } = req.user; // ดึง user_id และ role จาก token

    // ตรวจสอบว่าเป็น admin หรือไม่
    if (role === "admin") {
      // Admin สามารถเข้าถึงข้อมูลทุกฟิลด์
      const result = await pool.query(
        `SELECT 
          f.field_id, f.field_name, f.address, f.gps_location, f.documents,
          f.open_hours, f.close_hours, f.img_field, f.name_bank, 
          f.number_bank, f.account_holder, f.status, f.price_deposit, 
          f.open_days, f.field_description,f.cancel_hours,
          u.user_id, u.first_name, u.last_name, u.email,
          COALESCE(json_agg(
            DISTINCT jsonb_build_object(
              'sub_field_id', s.sub_field_id,
              'sub_field_name', s.sub_field_name,
              'players_per_team', s.players_per_team,
              'wid_field', s.wid_field,
              'length_field', s.length_field,
              'field_surface', s.field_surface,
              'price', s.price,
              'sport_name', sp.sport_name,
              'add_ons', (
                SELECT COALESCE(json_agg(jsonb_build_object(
                  'add_on_id', a.add_on_id,
                  'content', a.content,
                  'price', a.price
                )), '[]'::json) 
                FROM add_on a 
                WHERE a.sub_field_id = s.sub_field_id
              )
            )
          ) FILTER (WHERE s.sub_field_id IS NOT NULL), '[]'::json) AS sub_fields
        FROM field f
        INNER JOIN users u ON f.user_id = u.user_id
        LEFT JOIN sub_field s ON f.field_id = s.field_id
        LEFT JOIN sports_types sp ON s.sport_id = sp.sport_id
        WHERE f.field_id = $1
        GROUP BY f.field_id, u.user_id;`,
        [field_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "ไม่พบข้อมูลสนามกีฬา" });
      }
      return res.json(result.rows[0]);
    }

    // ตรวจสอบว่าเป็น field_owner และ field_id ตรงกับ user_id หรือไม่
    if (role === "field_owner") {
      const result = await pool.query(
        `SELECT 
          f.field_id, f.field_name, f.address, f.gps_location, f.documents,
          f.open_hours, f.close_hours, f.img_field, f.name_bank, 
          f.number_bank, f.account_holder, f.status, f.price_deposit, 
          f.open_days, f.field_description,
          u.user_id, u.first_name, u.last_name, u.email,
          COALESCE(json_agg(
            DISTINCT jsonb_build_object(
              'sub_field_id', s.sub_field_id,
              'sub_field_name', s.sub_field_name,
              'players_per_team', s.players_per_team,
              'wid_field', s.wid_field,
              'length_field', s.length_field,
              'field_surface', s.field_surface,
              'price', s.price,
              'sport_name', sp.sport_name,
              'add_ons', (
                SELECT COALESCE(json_agg(jsonb_build_object(
                  'add_on_id', a.add_on_id,
                  'content', a.content,
                  'price', a.price
                )), '[]'::json) 
                FROM add_on a 
                WHERE a.sub_field_id = s.sub_field_id
              )
            )
          ) FILTER (WHERE s.sub_field_id IS NOT NULL), '[]'::json) AS sub_fields
        FROM field f
        INNER JOIN users u ON f.user_id = u.user_id
        LEFT JOIN sub_field s ON f.field_id = s.field_id
        LEFT JOIN sports_types sp ON s.sport_id = sp.sport_id
        WHERE f.field_id = $1 AND f.user_id = $2
        GROUP BY f.field_id, u.user_id;`,
        [field_id, user_id]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
      }
      return res.json(result.rows[0]);
    }

    // หากไม่ใช่ admin หรือ field_owner
    return res.status(403).json({ error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลสนามกีฬา" });
  }
});

router.put("/update-status/:field_id", authMiddleware, async (req, res) => {
  try {
    const { field_id } = req.params;
    const { status, reasoning } = req.body;
    const { user_id, role } = req.user; // ดึงข้อมูลจาก token เพื่อเช็ค role ของผู้ใช้

    console.log("field_id ที่ได้รับ:", field_id);
    console.log("ข้อมูลที่ได้รับจาก Frontend:", req.body);

    if (!field_id || isNaN(field_id)) {
      console.log("field_id ไม่ถูกต้อง");
      return res.status(400).json({ error: "field_id ไม่ถูกต้อง" });
    }

    // ตรวจสอบว่า user เป็น admin หรือไม่
    if (role !== "admin") {
      return res
        .status(403)
        .json({ error: "คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลนี้" });
    }

    // ตรวจสอบว่ามี field_id อยู่จริง
    const checkField = await pool.query(
      "SELECT * FROM field WHERE field_id = $1",
      [field_id]
    );
    console.log("ข้อมูลจากฐานข้อมูล:", checkField.rows);

    if (checkField.rows.length === 0) {
      console.log("ไม่พบข้อมูลสนามกีฬาในฐานข้อมูล");
      return res.status(404).json({ error: "ไม่พบข้อมูลสนามกีฬา" });
    }

    const userData = await pool.query(
      "SELECT * FROM users WHERE user_id = $1",
      [checkField.rows[0].user_id]
    );
    const userfirstName = userData.rows[0].first_name; // << ใช้ค่านี้ส่งอีเมล

    if (status === "ผ่านการอนุมัติ") {
      const userId = checkField.rows[0].user_id;
      const userRole = userData.rows[0].role;
      if (userRole === "customer") {
        await pool.query(
          "UPDATE users SET role = 'field_owner' WHERE user_id = $1",
          [userId]
        );
      }

      try {
        const resultEmail = await resend.emails.send({
          from: process.env.Sender_Email,
          to: userData.rows[0].email,
          subject: "การอนุมัติสนามกีฬา",
          html: `
<div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: 10px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; margin-top:80px;box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); text-align:center;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <img src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926689/logo2small_lzsrwa.png" alt="Sport-Hub Online Logo" style="display: block; max-width: 300px; margin-bottom: 10px;" />
      </td>
    </tr>
  </table>
  <h1 style="color: #347433; margin-bottom: 16px; text-align: center">สนามกีฬาได้รับการอนุมัติ</h1>

  <p style="font-size: 16px; text-align: center; color: #333538ff;">
    <strong> สนามกีฬาของคุณ ${userfirstName} ได้รับการอนุมัติเรียบร้อยแล้ว </br >ขอบคุณที่ใช้บริการ</strong>
  </p>
  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="font-size: 12px; color: #9ca3af;text-align: center ">
    หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  </p>
</div>`,
        });
        console.log("อีเมลส่งสำเร็จ:", resultEmail);
      } catch (error) {
        console.log("ส่งอีเมลไม่สำเร็จ:", error);
        return res
          .status(500)
          .json({ error: "ไม่สามารถส่งอีเมลได้", details: error.message });
      }
    } else if (status === "ไม่ผ่านการอนุมัติ") {
      const userId = checkField.rows[0].user_id;
      const userRole = userData.rows[0].role;
      if (userRole === "field_owner") {
        await pool.query(
          "UPDATE users SET role = 'field_owner' WHERE user_id = $1",
          [userId]
        );
      }

      try {
        const resultEmail = await resend.emails.send({
          from: process.env.Sender_Email,
          to: userData.rows[0].email,
          subject: "การอนุมัติสนามกีฬา",
          html: `
<div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: 10px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; margin-top:80px;box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); text-align:center;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <img src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926689/logo2small_lzsrwa.png" alt="Sport-Hub Online Logo" style="display: block; max-width: 300px; margin-bottom: 10px;" />
      </td>
    </tr>
  </table>
  <h1 style="color: #DC2525; margin-bottom: 16px; text-align: center">สนามกีฬาไม่ได้รับการอนุมัติ</h1>

  <p style="font-size: 16px; text-align: center; color: #333538ff;">
  <strong>สนามกีฬาของคุณ ${userfirstName} ไม่ได้รับการอนุมัติ</strong><br/><br/>
</p>

<div style="margin: 16px 0; text-align:center;font-size: 18px;">
  <strong>เหตุผลที่ไม่ผ่านการอนุมัติ:</strong><br/>
  ${reasoning ? reasoning : "ไม่มีการระบุเหตุผล"}
</div>

<p style="font-size: 16px; text-align: center; color: #333538ff;">
  กรุณาตรวจสอบสนามกีฬาของคุณและส่งคำขอลงทะเบียนใหม่
</p>

  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="font-size: 12px; color: #9ca3af;text-align: center ">
    หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  </p>
</div>
          `,
        });
        console.log("อีเมลส่งสำเร็จ:", resultEmail);
      } catch (error) {
        console.log("ส่งอีเมลไม่สำเร็จ:", error);
        return res
          .status(500)
          .json({ error: "ไม่สามารถส่งอีเมลได้", details: error.message });
      }
    }

    // อัปเดตแค่สถานะของสนาม
    const result = await pool.query(
      `UPDATE field 
       SET status = $1  -- อัปเดตสถานะ
       WHERE field_id = $2 
       RETURNING *;`,
      [status, field_id]
    );

    console.log("ข้อมูลอัปเดตสำเร็จ:", result.rows[0]);

    res.json({ message: "อัปเดตข้อมูลสำเร็จ", data: result.rows[0] });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการอัปเดตสนามกีฬา",
      details: error.message,
    });
  }
});

// DELETE ลบสนามหลัก พร้อมลบ sub_field, add_on, โพส, รูป, เอกสาร
router.delete("/delete/field/:id", authMiddleware, async (req, res) => {
  const { id: fieldId } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ลบ add_on
    const subFields = await client.query(
      "SELECT sub_field_id FROM sub_field WHERE field_id = $1",
      [fieldId]
    );
    for (const sub of subFields.rows) {
      await client.query("DELETE FROM add_on WHERE sub_field_id = $1", [
        sub.sub_field_id,
      ]);
    }

    // ลบ sub_field
    await client.query("DELETE FROM sub_field WHERE field_id = $1", [fieldId]);

    // ลบ post_images และไฟล์ภาพ
    const postImages = await client.query(
      `SELECT pi.image_url FROM post_images pi JOIN posts p ON pi.post_id = p.post_id WHERE p.field_id = $1`,
      [fieldId]
    );

    for (const img of postImages.rows) {
      await deleteCloudinaryFile(img.image_url);
    }
    await client.query(
      `DELETE FROM post_images WHERE post_id IN 
       (SELECT post_id FROM posts WHERE field_id = $1)`,
      [fieldId]
    );

    await client.query(
      `DELETE FROM post_images WHERE post_id IN (SELECT post_id FROM posts WHERE field_id = $1)`,
      [fieldId]
    );

    // ลบ posts
    await client.query("DELETE FROM posts WHERE field_id = $1", [fieldId]);

    const imageUrls = postImages.rows.map((img) => img.image_url);
    await deleteMultipleCloudinaryFiles(imageUrls);

    await client.query(
      `DELETE FROM post_images WHERE post_id IN 
       (SELECT post_id FROM posts WHERE field_id = $1)`,
      [fieldId]
    );

    // ลบ posts
    await client.query("DELETE FROM posts WHERE field_id = $1", [fieldId]);

    // ลบไฟล์ของ field
    const fieldFiles = await client.query(
      "SELECT img_field, documents FROM field WHERE field_id = $1",
      [fieldId]
    );

    if (fieldFiles.rows.length > 0) {
      const { img_field, documents } = fieldFiles.rows[0];

      // ลบรูปภาพ field
      if (img_field) {
        await deleteCloudinaryFile(img_field);
      }

      // ลบเอกสาร
      if (documents) {
        let docPaths = [];

        try {
          if (Array.isArray(documents)) {
            docPaths = documents.filter((doc) => doc && doc.trim());
          } else if (typeof documents === "string") {
            // ลบ { } และแยกด้วย comma
            const cleanDocs = documents.replace(/^{|}$/g, "").trim();
            if (cleanDocs) {
              docPaths = cleanDocs
                .split(",")
                .map((doc) => doc.replace(/\\/g, "/").replace(/"/g, "").trim())
                .filter((doc) => doc);
            }
          }

          console.log("เอกสารที่จะลบ:", docPaths);
          await deleteMultipleCloudinaryFiles(docPaths);
        } catch (parseError) {
          console.error("แยกเอกสารไม่สำเร็จ:", parseError);
          console.log("Raw documents data:", documents);
        }
      }
    }

    // ลบ field
    await client.query("DELETE FROM field WHERE field_id = $1", [fieldId]);

    await client.query("COMMIT");
    res.status(200).json({
      message:
        "Field, subfields, addons, posts, and images deleted successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting field:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

router.put("/edit/:field_id", authMiddleware, async (req, res) => {
  try {
    const { field_id } = req.params;
    const { user_id, role } = req.user; // ดึง user_id และ role จาก token ใน authMiddleware
    const {
      field_name,
      address,
      gps_location,
      open_hours,
      close_hours,
      price_deposit,
      name_bank,
      account_holder,
      number_bank,
      img_field,
      documents,
      field_description,
      cancel_hours,
    } = req.body;

    console.log("field_id ที่ได้รับ:", field_id);
    console.log("ข้อมูลที่ได้รับจาก Frontend:", req.body);

    if (!field_id || isNaN(field_id)) {
      console.log("field_id ไม่ถูกต้อง");
      return res.status(400).json({ error: "field_id ไม่ถูกต้อง" });
    }

    // ตรวจสอบว่ามี field_id อยู่จริงในฐานข้อมูล
    const checkField = await pool.query(
      "SELECT * FROM field WHERE field_id = $1",
      [field_id]
    );
    console.log("ข้อมูลจากฐานข้อมูล:", checkField.rows);

    if (checkField.rows.length === 0) {
      console.log("ไม่พบข้อมูลสนามกีฬาในฐานข้อมูล");
      return res.status(404).json({ error: "ไม่พบข้อมูลสนามกีฬา" });
    }

    // หากเป็น admin สามารถอัปเดตข้อมูลทุกฟิลด์
    if (role === "admin") {
      console.log("Admin อัปเดตข้อมูลสนามกีฬา");

      const result = await pool.query(
        `UPDATE field 
         SET field_name = COALESCE($1, field_name), 
             address = COALESCE($2, address), 
             gps_location = COALESCE($3, gps_location),
             open_hours = COALESCE($4, open_hours), 
             close_hours = COALESCE($5, close_hours),
             price_deposit = COALESCE($6, price_deposit), 
             name_bank = COALESCE($7, name_bank),
             account_holder = COALESCE($8, account_holder), 
             number_bank = COALESCE($9, number_bank),
             img_field = COALESCE($10, img_field),
             documents = COALESCE($11, documents),
             field_description = COALESCE($12, field_description),
             cancel_hours = COALESCE($13, cancel_hours)
         WHERE field_id = $14
         RETURNING *;`,
        [
          field_name,
          address,
          gps_location,
          open_hours,
          close_hours,
          price_deposit,
          name_bank,
          account_holder,
          number_bank,
          img_field,
          documents,
          field_description,
          cancel_hours,
          field_id,
        ]
      );

      console.log("ข้อมูลอัปเดตสำเร็จ:", result.rows[0]);
      return res.json({ message: "อัปเดตข้อมูลสำเร็จ", data: result.rows[0] });
    }

    // หากเป็น field_owner ต้องตรวจสอบว่า user_id ของผู้ใช้ตรงกับ owner ของฟิลด์นี้หรือไม่
    if (role === "field_owner" && checkField.rows[0].user_id === user_id) {
      console.log("Field owner อัปเดตข้อมูลสนามกีฬา");

      const result = await pool.query(
        `UPDATE field 
         SET field_name = COALESCE($1, field_name), 
             address = COALESCE($2, address), 
             gps_location = COALESCE($3, gps_location),
             open_hours = COALESCE($4, open_hours), 
             close_hours = COALESCE($5, close_hours),
             price_deposit = COALESCE($6, price_deposit), 
             name_bank = COALESCE($7, name_bank),
             account_holder = COALESCE($8, account_holder), 
             number_bank = COALESCE($9, number_bank),
             img_field = COALESCE($10, img_field),
             documents = COALESCE($11, documents),
             field_description = COALESCE($12, field_description),
             cancel_hours = COALESCE($13, cancel_hours)
         WHERE field_id = $14 AND user_id = $15
         RETURNING *;`,
        [
          field_name,
          address,
          gps_location,
          open_hours,
          close_hours,
          price_deposit,
          name_bank,
          account_holder,
          number_bank,
          img_field,
          documents,
          field_description,
          cancel_hours,
          field_id,
          user_id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: "คุณไม่มีสิทธิ์อัปเดตข้อมูลนี้" });
      }

      console.log("ข้อมูลอัปเดตสำเร็จ:", result.rows[0]);
      return res.json({ message: "อัปเดตข้อมูลสำเร็จ", data: result.rows[0] });
    }

    // หากไม่ใช่ admin หรือ field_owner จะไม่สามารถอัปเดตได้
    return res.status(403).json({ error: "คุณไม่มีสิทธิ์อัปเดตข้อมูลนี้" });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการอัปเดตสนามกีฬา",
      details: error.message,
    });
  }
});

// สำหรับอัปโหลดรูปภาพ
router.post(
  "/:field_id/upload-image",
  authMiddleware,
  upload.single("img_field"),
  async (req, res) => {
    try {
      const { field_id } = req.params;
      const filePath = req.file?.path; // รับ path ของไฟล์รูปภาพ

      if (!filePath) return res.status(400).json({ error: "ไม่พบไฟล์รูปภาพ" });

      const oldImg = await pool.query(
        "SELECT img_field FROM field WHERE field_id = $1",
        [field_id]
      );
      const oldPath = oldImg.rows[0]?.img_field;

      if (oldPath) {
        await deleteCloudinaryFile(oldPath); // ลบไฟล์เดิมบน Cloudinary
      }

      // อัปเดต path ของไฟล์ในฐานข้อมูล
      await pool.query(`UPDATE field SET img_field = $1 WHERE field_id = $2`, [
        filePath,
        field_id,
      ]);

      res.json({ message: "อัปโหลดรูปสำเร็จ", path: filePath });
    } catch (error) {
      console.error("Upload image error:", error);
      res
        .status(500)
        .json({ error: "อัปโหลดรูปไม่สำเร็จ", details: error.message });
    }
  }
);

router.post(
  "/:field_id/upload-document",
  upload.array("documents", 10),
  authMiddleware,
  async (req, res) => {
    try {
      const { field_id } = req.params;

      // ตรวจสอบว่ามีไฟล์หรือไม่
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "ไม่พบไฟล์เอกสาร" });
      }

      const oldDocs = await pool.query(
        "SELECT documents FROM field WHERE field_id = $1",
        [field_id]
      );
      const docPaths = oldDocs.rows[0]?.documents;

      if (docPaths) {
        const cleanedPaths = docPaths
          .replace(/^{|}$/g, "")
          .split(",")
          .map((p) => p.replace(/"/g, "").replace(/\\/g, "/").trim())
          .filter(Boolean);

        // ลบเอกสารเก่าออกจาก Cloudinary
        for (const url of cleanedPaths) {
          await deleteCloudinaryFile(url);
        }
      }

      const filePaths = req.files.map((file) => file.path);

      await pool.query(
        `UPDATE field SET documents = $1 WHERE field_id = $2`,
        [filePaths.join(", "), field_id] // เก็บ path ของไฟล์ที่อัปโหลดในฐานข้อมูล
      );

      res.json({ message: "อัปโหลดเอกสารสำเร็จ", paths: filePaths });
      console.log("filepayh", filePaths);
    } catch (error) {
      console.error("Upload document error:", error);
      res
        .status(500)
        .json({ error: "อัปโหลดเอกสารไม่สำเร็จ", details: error.message });
    }
  }
);

router.post("/subfield/:field_id", authMiddleware, async (req, res) => {
  const { field_id } = req.params;
  const {
    sub_field_name,
    price,
    sport_id,
    players_per_team,
    wid_field,
    length_field,
    field_surface,
    user_id,
  } = req.body;

  if (!sport_id || isNaN(sport_id)) {
    return res.status(400).json({ error: "กรุณาเลือกประเภทกีฬาก่อนเพิ่มสนาม" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sub_field (field_id, sub_field_name, price, sport_id, players_per_team ,wid_field ,length_field, field_surface, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        field_id,
        sub_field_name,
        price,
        sport_id,
        players_per_team,
        wid_field,
        length_field,
        field_surface,
        user_id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("เพิ่ม sub_field ผิดพลาด:", error);
    res.status(500).json({ error: "เพิ่ม sub_field ล้มเหลว" });
  }
});

router.post("/addon", authMiddleware, async (req, res) => {
  const { sub_field_id, content, price } = req.body;

  if (!sub_field_id || !content || !price) {
    return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO add_on (sub_field_id, content, price) 
       VALUES ($1, $2, $3) RETURNING *`,
      [sub_field_id, content, price]
    );

    res.status(201).json(result.rows[0]); //  ส่ง Add-on ใหม่กลับไป
  } catch (error) {
    console.error("เพิ่ม Add-on ผิดพลาด:", error);
    res.status(500).json({ error: "ไม่สามารถเพิ่ม Add-on ได้" });
  }
});

router.delete("/delete/addon/:id", authMiddleware, async (req, res) => {
  const addOnId = req.params.id;

  if (isNaN(addOnId)) {
    return res.status(400).json({ error: "รหัส Add-on ไม่ถูกต้อง" });
  }

  try {
    // ตรวจสอบก่อนว่ามี add-on นี้ไหม
    const check = await pool.query(
      "SELECT * FROM add_on WHERE add_on_id = $1",
      [addOnId]
    );

    if (check.rowCount === 0) {
      return res.status(404).json({ error: "ไม่พบ Add-on ที่ต้องการลบ" });
    }

    // ลบออกจากฐานข้อมูล
    await pool.query("DELETE FROM add_on WHERE add_on_id = $1", [addOnId]);

    res.status(200).json({ message: "ลบ Add-on สำเร็จ" });
  } catch (error) {
    console.error("ลบ Add-on ผิดพลาด:", error);
    res.status(500).json({ error: "ลบ Add-on ไม่สำเร็จ" });
  }
});

router.put("/supfiled/:sub_field_id", authMiddleware, async (req, res) => {
  const { sub_field_id } = req.params;
  const {
    sub_field_name,
    price,
    sport_id,
    players_per_team,
    wid_field,
    length_field,
    field_surface,
  } = req.body;

  try {
    if (!sub_field_id) return res.status(400).json({ error: "sub_field_id" });

    await pool.query(
      `UPDATE sub_field SET sub_field_name = $1, price = $2, sport_id = $3 , players_per_team = $4, wid_field = $5, length_field = $6, field_surface = $7 WHERE sub_field_id = $8`,
      [
        sub_field_name,
        price,
        sport_id,
        players_per_team,
        wid_field,
        length_field,
        field_surface,
        sub_field_id,
      ]
    );
    res.json({ message: "สำเร็จ" });
  } catch (error) {
    console.error("Error updating sub-field:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลสนามย่อย" });
  }
});

// Update add-on
router.put("/add_on/:add_on_id", authMiddleware, async (req, res) => {
  const { add_on_id } = req.params;
  const { content, price } = req.body;

  try {
    if (!add_on_id) return res.status(400).json({ error: "add_on_id" });

    await pool.query(
      `UPDATE add_on SET content = $1, price = $2 WHERE add_on_id = $3`,
      [content, price, add_on_id]
    );
    res.json({ message: "สำเร็จ" });
  } catch (error) {
    console.error("Error updating add-on:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดต Add-on" });
  }
});

router.delete("/delete/subfield/:id", authMiddleware, async (req, res) => {
  const subFieldId = req.params.id;
  if (isNaN(subFieldId) || !Number.isInteger(Number(subFieldId))) {
    return res.status(400).json({ error: "Invalid subfield ID" });
  }

  try {
    // Check if subfield exists before deleting
    const subFieldQuery = await pool.query(
      "SELECT * FROM sub_field WHERE sub_field_id = $1",
      [subFieldId]
    );

    if (subFieldQuery.rows.length === 0) {
      return res.status(404).json({ error: "Subfield not found" });
    }

    // Proceed to delete the subfield
    await pool.query("DELETE FROM sub_field WHERE sub_field_id = $1", [
      subFieldId,
    ]);

    return res.status(200).json({ message: "Subfield deleted successfully" });
  } catch (error) {
    console.error("Error deleting subfield:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/facilities/:field_id", authMiddleware, async (req, res) => {
  const { field_id } = req.params;
  const selectedFacilities = req.body.selectedFacilities;

  try {
    for (const facId in selectedFacilities) {
      const facPrice = parseFloat(selectedFacilities[facId]) || 0;
      await pool.query(
        `INSERT INTO field_facilities (field_id, facility_id, fac_price) 
         VALUES ($1, $2, $3)`,
        [field_id, facId, facPrice]
      );
    }

    res.status(200).json({ message: "บันทึกสำเร็จ" });
  } catch (error) {
    console.error("Error saving facilities:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดระหว่างบันทึก" });
  }
});

router.delete(
  "/facilities/:field_id/:field_fac_id",
  authMiddleware,
  async (req, res) => {
    const { field_id, field_fac_id } = req.params;
    console.log("Received field_id:", field_id);
    console.log("Received field_fac_id:", field_fac_id);

    try {
      const result = await pool.query(
        "DELETE FROM field_facilities WHERE field_id = $1 AND field_fac_id = $2",
        [field_id, field_fac_id]
      );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ message: "ไม่พบสิ่งอำนวยความสะดวกนี้ในสนาม" });
      }

      res.status(200).json({ message: "ลบสิ่งอำนวยความสะดวกสำเร็จ" });
    } catch (error) {
      console.error("Error deleting facility:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
    }
  }
);

router.get("/open-days/:sub_field_id", authMiddleware, async (req, res) => {
  const { sub_field_id } = req.params;
  if (isNaN(sub_field_id)) {
    return res.status(404).json({ error: "Invalid subfield ID" });
  }
  try {
    const field_id_result = await pool.query(
      `SELECT field_id FROM sub_field WHERE sub_field_id = $1`,
      [sub_field_id]
    );

    if (field_id_result.rows.length === 0) {
      return res.status(404).json({ error: "Subfield not found" });
    }

    const field_id = field_id_result.rows[0].field_id;

    const result = await pool.query(
      `SELECT 
          f.field_id, f.field_name, f.address, f.gps_location, f.documents,
          f.open_hours, f.close_hours, f.img_field, f.name_bank, 
          f.number_bank, f.account_holder, f.status, f.price_deposit, 
          f.open_days, f.field_description,
          u.user_id, u.first_name, u.last_name, u.email,
          COALESCE(json_agg(
            DISTINCT jsonb_build_object(
              'sub_field_id', s.sub_field_id,
              'sub_field_name', s.sub_field_name,
              'players_per_team', s.players_per_team,
              'wid_field', s.wid_field,
              'length_field', s.length_field,
              'field_surface', s.field_surface,
              'price', s.price,
              'sport_name', sp.sport_name,
              'add_ons', (
                SELECT COALESCE(json_agg(jsonb_build_object(
                  'add_on_id', a.add_on_id,
                  'content', a.content,
                  'price', a.price
                )), '[]'::json) 
                FROM add_on a 
                WHERE a.sub_field_id = s.sub_field_id
              )
            )
          ) FILTER (WHERE s.sub_field_id IS NOT NULL), '[]'::json) AS sub_fields
        FROM field f
        INNER JOIN users u ON f.user_id = u.user_id
        LEFT JOIN sub_field s ON f.field_id = s.field_id
        LEFT JOIN sports_types sp ON s.sport_id = sp.sport_id
        WHERE f.field_id = $1
        GROUP BY f.field_id, u.user_id;`,
      [field_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูล" });
    }
    return res.json(result.rows);
  } catch (error) {
    console.error("Error:", error);
    return res.status(404).json({ error: "Error Fetch Data" });
  }
});

router.get("/field-data/:sub_field_id", authMiddleware, async (req, res) => {
  const { sub_field_id } = req.params;
  if (isNaN(sub_field_id)) {
    return res.status(404).json({ error: "Invalid subfield ID" });
  }
  try {
    const field_id_result = await pool.query(
      `SELECT field_id FROM sub_field WHERE sub_field_id = $1`,
      [sub_field_id]
    );

    if (field_id_result.rows.length === 0) {
      return res.status(404).json({ error: "Subfield not found" });
    }

    const field_id = field_id_result.rows[0].field_id;

    const result = await pool.query(
      `SELECT 
      f.field_id, f.field_name, f.address, f.gps_location, f.documents,
      f.open_hours, f.close_hours, f.img_field, f.name_bank, 
      f.number_bank, f.account_holder, f.status, f.price_deposit, 
      f.open_days, f.field_description,
      u.user_id, u.first_name, u.last_name, u.email,
      COALESCE(json_agg(
        DISTINCT jsonb_build_object(
          'sub_field_id', s.sub_field_id,
          'sub_field_name', s.sub_field_name,
          'players_per_team', s.players_per_team,
          'wid_field', s.wid_field,
          'length_field', s.length_field,
          'field_surface', s.field_surface,
          'price', s.price,
          'sport_name', sp.sport_name,
          'add_ons', (
            SELECT COALESCE(json_agg(jsonb_build_object(
              'add_on_id', a.add_on_id,
              'content', a.content,
              'price', a.price
            )), '[]'::json) 
            FROM add_on a 
            WHERE a.sub_field_id = s.sub_field_id
          )
        )
      ) FILTER (WHERE s.sub_field_id IS NOT NULL), '[]'::json) AS sub_fields
    FROM field f
    INNER JOIN users u ON f.user_id = u.user_id
    LEFT JOIN sub_field s ON f.field_id = s.field_id
    LEFT JOIN sports_types sp ON s.sport_id = sp.sport_id
    WHERE f.field_id = $1
    GROUP BY f.field_id, u.user_id;`,
      [field_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูล" });
    }

    return res.status(200).json({
      message: "get data successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(404).json({ error: "Error Fetch Data" });
  }
});

router.get("/field-fac/:field_id", authMiddleware, async (req, res) => {
  const { field_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT fi.field_fac_id , fi.field_id , fi.facility_id , fi.fac_price ,fa.fac_name  
        FROM field_facilities fi
      INNER JOIN facilities fa ON fi.facility_id = fa.fac_id
      WHERE fi.field_id = $1
         `,
      [field_id]
    );
    return res.status(200).json({
      message: "get data successfully",
      data: result.rows,
    });
  } catch (error) {
    return res.status(400).json({ message: "error" });
  }
});

module.exports = router;
