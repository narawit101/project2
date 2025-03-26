const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");

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

// admin api ////////////////////////////////////////////////////////////////////////////////////////
router.get('/pending',authMiddleware, async(req,res)=>{
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

router.get('/allow' ,authMiddleware,async(req,res)=>{
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

router.get('/refuse' ,authMiddleware ,async(req,res)=>{
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


router.get("/:field_id",authMiddleware, async (req, res) => {
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
                  'sport_name', sp.sport_name, -- เพิ่ม sport_name
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
        LEFT JOIN sports_types sp ON s.sport_id = sp.sport_id -- เพิ่มการ JOIN กับตาราง sports_types
        WHERE f.field_id = $1
        GROUP BY f.field_id, u.user_id;
`,
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

router.put("/:field_id",authMiddleware, async (req, res) => {
  try {
    const { field_id } = req.params;
    const { status } = req.body;

    console.log("📌 field_id ที่ได้รับ:", field_id);
    console.log("📌 ข้อมูลที่ได้รับจาก Frontend:", req.body);

    if (!field_id || isNaN(field_id)) {
      console.log("❌ field_id ไม่ถูกต้อง");
      return res.status(400).json({ error: "❌ field_id ไม่ถูกต้อง" });
    }

    // ตรวจสอบว่ามี field_id อยู่จริง
    const checkField = await pool.query("SELECT * FROM field WHERE field_id = $1", [field_id]);
    console.log("📌 ข้อมูลจากฐานข้อมูล:", checkField.rows);

    if (checkField.rows.length === 0) {
      console.log("❌ ไม่พบข้อมูลสนามกีฬาในฐานข้อมูล");
      return res.status(404).json({ error: "❌ ไม่พบข้อมูลสนามกีฬา" });
    }

    // ถ้าสถานะเป็น "ผ่านการอนุมัติ" ให้เปลี่ยน role ของผู้ใช้งานเป็น "field_owner"
    if (status === "ผ่านการอนุมัติ") {
      const userId = checkField.rows[0].user_id;  // ดึง user_id ของเจ้าของสนาม
      await pool.query(
        "UPDATE users SET role = 'field_owner' WHERE user_id = $1",
        [userId]
      );
    }
    // ถ้าสถานะเป็น "ไม่ผ่านการอนุมัติ" ให้เปลี่ยน role ของผู้ใช้งานเป็น "customer"
    else if (status === "ไม่ผ่านการอนุมัติ") {
      const userId = checkField.rows[0].user_id;  // ดึง user_id ของเจ้าของสนาม
      await pool.query(
        "UPDATE users SET role = 'customer' WHERE user_id = $1",
        [userId]
      );
    }

    // ✅ อัปเดตแค่สถานะของสนาม
    const result = await pool.query(
      `UPDATE field 
       SET status = $1  -- อัปเดตสถานะ
       WHERE field_id = $2 
       RETURNING *;`,
      [status, field_id]
    );

    console.log("✅ ข้อมูลอัปเดตสำเร็จ:", result.rows[0]);

    res.json({ message: "✅ อัปเดตข้อมูลสำเร็จ", data: result.rows[0] });
  } catch (error) {
    console.error("❌ Database Error:", error);
    res.status(500).json({ error: "❌ เกิดข้อผิดพลาดในการอัปเดตสนามกีฬา", details: error.message });
  }
});

///mydield
router.get("/myfields", authMiddleware, async (req, res) => {
  try {
    console.log("🔍 Headers:", req.headers);
    console.log("🔍 Token received:", req.headers.authorization);

    if (!req.user || !req.user.user_id) {
      console.error("❌ Unauthorized: No user ID");
      return res.status(401).json({ error: "Unauthorized: No user ID" });
    }

    const user_id = req.query.sport_id;
    console.log("🔍 User ID:", user_id);

    // ตรวจสอบการเชื่อมต่อฐานข้อมูล
    console.log("🔍 Checking database connection...");
    const client = await pool.connect();
    console.log("✅ Database connected!");

    const query = "SELECT * FROM field WHERE user_id = $1";
    console.log("🔍 Running Query:", query, "with user_id:", user_id);

    try {
      const result = await client.query(query, [user_id]);
      console.log("✅ Database Result:", result.rows);

      if (result.rows.length === 0) {
        console.error("❌ No fields found for user:", user_id);
        return res.status(404).json({ error: "No fields found" });
      }

      client.release();
      res.json(result.rows);
    } catch (queryError) {
      console.error("❌ SQL Query Error:", queryError);
      res.status(500).json({
        error: "Database query error",
        details: queryError.message,
        stack: queryError.stack,
      });
    }
  } catch (error) {
    console.error("❌ Database Error:", error);
    res.status(500).json({
      error: "Database connection error",
      details: error.message,
      stack: error.stack,
    });
  }
});

module.exports = router;