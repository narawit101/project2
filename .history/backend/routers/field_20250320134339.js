const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const pool = require("../db");

// ✅ ตั้งค่า multer เพื่อบันทึกไฟล์ลงโฟลเดอร์ `uploads/`
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = "";
    // กำหนดว่าไฟล์แต่ละประเภทจะไปอยู่ในโฟลเดอร์ไหน
    if (file.fieldname === "documents") {
      uploadDir = "uploads/documents/"; // โฟลเดอร์สำหรับเอกสาร
    } else if (file.fieldname === "img_field") {
      uploadDir = "uploads/images/"; // โฟลเดอร์สำหรับรูปภาพ
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// ✅ รองรับการอัปโหลด **หลายไฟล์**
const upload = multer({ storage: storage });

// 📌 API ลงทะเบียนสนามกีฬา

router.post("/register", upload.fields([{ name: "documents" }, { name: "img_field" }]), async (req, res) => {
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
      open_days 
    } = JSON.parse(req.body.data);

    // ✅ ตรวจสอบว่ามีไฟล์เอกสารอัปโหลดหรือไม่
    const documents = req.files["documents"] && req.files["documents"].length > 0 ? req.files["documents"][0].path : null;
    const imgField = req.files["img_field"] && req.files["img_field"].length > 0 ? req.files["img_field"][0].path : null;

    // ตรวจสอบว่าเอกสารได้รับการอัปโหลดหรือไม่
    if (!documents) {
      return res.status(400).send({ error: "กรุณาอัปโหลดเอกสาร" });
    }

    const fieldResult = await pool.query(
      `INSERT INTO field (user_id, field_name, address, gps_location, open_hours, close_hours, number_bank, account_holder, price_deposit, name_bank, documents, img_field, status,open_days) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING field_id`,
      [user_id, field_name, address, gps_location, open_hours, close_hours, number_bank, account_holder, price_deposit, name_bank, documents, imgField, status || "รอตรวจสอบ",open_days]
    );
    
    const field_id = fieldResult.rows[0].field_id;
    
 // 📌 INSERT ข้อมูลสนามย่อย
for (const sub of subFields) {
  const subFieldResult = await pool.query(
    `INSERT INTO sub_field (field_id, sub_field_name, price, sport_id, user_id) 
     VALUES ($1, $2, $3, $4, $5) RETURNING sub_field_id`,
    [field_id, sub.name, sub.price, sub.sport_id, user_id]
  );
  const sub_field_id = subFieldResult.rows[0].sub_field_id;
   // 📌 เพิ่ม add_on ที่เกี่ยวข้องกับ sub_field
   for (const addon of sub.addOns) {
    await pool.query(
      `INSERT INTO add_on (sub_field_id, content, price) VALUES ($1, $2, $3) RETURNING add_on_id`,
      [sub_field_id, addon.content, addon.price]
    );
  }
} 
    // ✅ INSERT ข้อมูลสิ่งอำนวยความสะดวก (ส่วนที่หายไป)
    for (const facId in selectedFacilities) {
      await pool.query(
        `INSERT INTO field_facilities (field_id, facility_id, fac_price) 
         VALUES ($1, $2, $3)`,
        [field_id, facId, selectedFacilities[facId]]
      );
    }
    
    res.status(200).send({ message: "ลงทะเบียนสนามเรียบร้อย!", field_id });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "เกิดข้อผิดพลาดในการลงทะเบียนสนาม" });
  }
});

router.get('/pending',async(req,res)=>{
  try {
      const result = await pool.query(`SELECT users.user_id,users.first_name,users.last_name,users.email,field.field_id,field.field_name,field.address,field.gps_location,field.documents,field.open_hours,field.close_hours,field.img_field,field.number_bank,field.account_holder,field.status,field.price_deposit 
        FROM field 
        INNER JOIN  users ON field.user_id = users.user_id
        WHERE status='รอตรวจสอบ'`);
      res.json(result.rows);
  }
  catch(error){
      res.status(500).json({error:'Database error fetching pending fields'});
  }
});

router.get('/allow',async(req,res)=>{
  try {
      const result = await pool.query(`SELECT users.user_id,users.first_name,users.last_name,users.email,field.field_id,field.field_name,field.address,field.gps_location,field.documents,field.open_hours,field.close_hours,field.img_field,field.number_bank,field.account_holder,field.status,field.price_deposit 
        FROM field 
        INNER JOIN  users ON field.user_id = users.user_id
        WHERE status='ผ่านการอนุมัติ'`);
      res.json(result.rows);
  }
  catch(error){
      res.status(500).json({error:'Database error fetching pending fields'});
  }
});

router.get('/refuse',async(req,res)=>{
  try {
      const result = await pool.query(`SELECT users.user_id,users.first_name,users.last_name,users.email,field.field_id,field.field_name,field.address,field.gps_location,field.documents,field.open_hours,field.close_hours,field.img_field,field.number_bank,field.account_holder,field.status,field.price_deposit 
        FROM field 
        INNER JOIN  users ON field.user_id = users.user_id
        WHERE status='ไม่ผ่านการอนุมัติ'`);
      res.json(result.rows);
  }
  catch(error){
      res.status(500).json({error:'Database error fetching pending fields'});
  }
});

router.get("/:field_id", async (req, res) => {
  try {
    const { field_id } = req.params;

    const result = await pool.query(
      `SELECT 
          f.field_id, f.field_name, f.address, f.gps_location, f.documents,
          f.open_hours, f.close_hours, f.img_field, f.name_bank, 
          f.number_bank, f.account_holder, f.status, f.price_deposit, 
          f.open_days,
          u.user_id, u.first_name, u.last_name, u.email,

          -- ดึงข้อมูล sub_field และรวม add_on เป็น JSON
          COALESCE(json_agg(
            DISTINCT jsonb_build_object(
              'sub_field_id', s.sub_field_id,
              'sub_field_name', s.sub_field_name,
              'price', s.price,
              'sport_id', s.sport_id,
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
        WHERE f.field_id = $1
        GROUP BY f.field_id, u.user_id;`,
      [field_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลสนามกีฬา" });
    }

    res.json(result.rows[0]);  // ส่งข้อมูลสนามพร้อมสถานะ, open_days, sub_field, add_on
  } catch (error) {
    console.error("❌ Database Error:", error);
    res.status(500).json({ error: "Database error fetching field data" });
  }
});

router.put("/:field_id/status", async (req, res) => {
  try {
    const { field_id } = req.params;
    const { status } = req.body;  // รับสถานะใหม่

    if (status !== 'ผ่านการอนุมัติ' && status !== 'ไม่ผ่านการอนุมัติ') {
      return res.status(400).json({ error: "สถานะไม่ถูกต้อง" });
    }

    const result = await pool.query(
      `UPDATE field
      SET status = $1
      WHERE field_id = $2
      RETURNING *`,
      [status, field_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลสนาม" });
    }

    res.json({
      message: "อัปเดตสถานะสำเร็จ",
      field: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Database Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตสถานะสนาม" });
  }
});




module.exports = router;