const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");
const {Resend} = require("resend")
require("dotenv").config();
const resend = new Resend(process.env.Resend_API);

// ตั้งค่า multer เพื่อบันทึกไฟล์ลงโฟลเดอร์ `uploads/`
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

// รองรับการอัปโหลด **หลายไฟล์**
const upload = multer({
  storage: storage,
  limits: {
    files: 10,
    fileSize: 8 * 1024 * 1024, 
  },
});

// ลงทะเบียนสนามกีฬา
router.post("/register", upload.fields([{ name: "documents" }, { name: "img_field" }]),authMiddleware, async (req, res) => {
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
      field_description  // New field for description
    } = JSON.parse(req.body.data);

         // ✅ ตรวจสอบว่ามีไฟล์เอกสารอัปโหลดหรือไม่
      const documents = req.files["documents"]
            ? req.files["documents"].map((file) => file.path.replace(/\\/g, "/")).join(", ") // คลีนพาธแล้วคั่นด้วย ", "
            : [];

      const imgField = req.files["img_field"] && req.files["img_field"].length > 0 ? req.files["img_field"][0].path : null;

    // ตรวจสอบว่าเอกสารได้รับการอัปโหลดหรือไม่
    if (documents.length === 0) {
      return res.status(400).send({ error: "กรุณาอัปโหลดเอกสาร" });
    }

    const fieldResult = await pool.query(
      `INSERT INTO field (user_id, field_name, address, gps_location, open_hours, close_hours, number_bank, account_holder, price_deposit, name_bank, documents, img_field, status, open_days, field_description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING field_id`,
      [user_id, field_name, address, gps_location, open_hours, close_hours, number_bank, account_holder, price_deposit, name_bank, documents, imgField, status || "รอตรวจสอบ", open_days, field_description]  // Save the description
    );
        

    const field_id = fieldResult.rows[0].field_id;
    
    // INSERT ข้อมูลสนามย่อย
    for (const sub of subFields) {
      const subFieldResult = await pool.query(
        `INSERT INTO sub_field (field_id, sub_field_name, price, sport_id, user_id) 
         VALUES ($1, $2, $3, $4, $5) RETURNING sub_field_id`,
        [field_id, sub.name, sub.price, sub.sport_id, user_id]
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

    // ✅ INSERT ข้อมูลสิ่งอำนวยความสะดวก
    for (const facId in selectedFacilities) {
      await pool.query(
        `INSERT INTO field_facilities (field_id, facility_id, fac_price) 
         VALUES ($1, $2, $3)`,
        [field_id, facId, selectedFacilities[facId]]
      );
    }
     // ดึงข้อมูลผู้ใช้ (รวมถึง user_email)
     const userData = await pool.query("SELECT * FROM users WHERE user_id = $1", [user_id]);

     // สมมุติว่าในตาราง users มีคอลัมน์ชื่อ user_email
     const userEmail = userData.rows[0].email; // << ใช้ค่านี้ส่งอีเมล

     // ส่งอีเมล
     try {
       const resultEmail = await resend.emails.send({
         from: process.env.Sender_Email,
         to: userEmail, // ใช้ค่าที่ดึงมา
         subject: "ลงทะเบียนสนาม",
         text: "คุณได้ลงทะเบียนสนามเรียบร้อยแล้ว รอผู้ดูแลตรวจสอบ",
       });
       console.log("อีเมลส่งสำเร็จ:", resultEmail);
     } catch (error) {
       console.log("ส่งอีเมลไม่สำเร็จ:", error);
       return res.status(500).json({ error: "ไม่สามารถส่งอีเมลได้", details: error.message });
     }
     res.status(200).send({ message: "ลงทะเบียนสนามเรียบร้อย!", field_id });


  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "เกิดข้อผิดพลาดในการลงทะเบียนสนาม" });
  }
});


// admin api ////////////////////////////////////////////////////////////////////////////////////////
// API สำหรับดึงข้อมูลสนามที่รอตรวจสอบ
// router.get('/pending', authMiddleware, async (req, res) => {
//   try {
//     // ตรวจสอบว่า user เป็น admin หรือไม่
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
//     }

//     const result = await pool.query(`
//       SELECT users.user_id, users.first_name, users.last_name, users.email, 
//              field.field_id, field.field_name, field.address, field.gps_location, 
//              field.documents, field.open_hours, field.close_hours, field.img_field, 
//              field.number_bank, field.account_holder, field.status, field.price_deposit 
//       FROM field 
//       INNER JOIN users ON field.user_id = users.user_id
//       WHERE status = 'รอตรวจสอบ'`);
      
//     res.json(result.rows);
//   } catch (error) {
//     res.status(500).json({ error: 'Database error fetching pending fields' });
//   }
// });

// // API สำหรับดึงข้อมูลสนามที่ผ่านการอนุมัติ
// router.get('/allow', authMiddleware, async (req, res) => {
//   try {
//     // ตรวจสอบว่า user เป็น admin หรือไม่
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
//     }

//     const result = await pool.query(`
//       SELECT users.user_id, users.first_name, users.last_name, users.email, 
//              field.field_id, field.field_name, field.address, field.gps_location, 
//              field.documents, field.open_hours, field.close_hours, field.img_field, 
//              field.number_bank, field.account_holder, field.status, field.price_deposit 
//       FROM field 
//       INNER JOIN users ON field.user_id = users.user_id
//       WHERE status = 'ผ่านการอนุมัติ'`);
      
//     res.json(result.rows);
//   } catch (error) {
//     res.status(500).json({ error: 'Database error fetching allowed fields' });
//   }
// });

// // API สำหรับดึงข้อมูลสนามที่ไม่ผ่านการอนุมัติ
// router.get('/refuse', authMiddleware, async (req, res) => {
//   try {
//     // ตรวจสอบว่า user เป็น admin หรือไม่
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
//     }

//     const result = await pool.query(`
//       SELECT users.user_id, users.first_name, users.last_name, users.email, 
//              field.field_id, field.field_name, field.address, field.gps_location, 
//              field.documents, field.open_hours, field.close_hours, field.img_field, 
//              field.number_bank, field.account_holder, field.status, field.price_deposit 
//       FROM field 
//       INNER JOIN users ON field.user_id = users.user_id
//       WHERE status = 'ไม่ผ่านการอนุมัติ'`);
      
//     res.json(result.rows);
//   } catch (error) {
//     res.status(500).json({ error: 'Database error fetching refused fields' });
//   }
// });

router.put("/update-status/:field_id", authMiddleware, async (req, res) => {
  try {
    const { field_id } = req.params;  // รับ field_id จาก URL params
    const { status } = req.body;      // รับ status ที่จะอัปเดตจาก body
    const { user_id, role } = req.user;  // ดึงข้อมูลจาก token เพื่อเช็ค role ของผู้ใช้

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
    const checkField = await pool.query("SELECT * FROM field WHERE field_id = $1", [field_id]);
    console.log("ข้อมูลจากฐานข้อมูล:", checkField.rows);

    if (checkField.rows.length === 0) {
      console.log("ไม่พบข้อมูลสนามกีฬาในฐานข้อมูล");
      return res.status(404).json({ error: "ไม่พบข้อมูลสนามกีฬา" });
    }

    const fieldOwnerId = checkField.rows[0].user_id;  // user_id ของเจ้าของสนาม

    // ถ้าผู้ใช้ไม่ใช่ admin และไม่ใช่เจ้าของสนาม จะไม่อนุญาตให้เปลี่ยนแปลง
    if (role !== "admin" && user_id !== fieldOwnerId) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลนี้" });
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

    res.json({ message: "อัปเดตสถานะสำเร็จ", data: result.rows[0] });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตสนามกีฬา", details: error.message });
  }
});


router.get("/:field_id", authMiddleware, async (req, res) => {
  try {
    const { field_id } = req.params;
    const { user_id, role } = req.user;  // ดึง user_id และ role จาก token

    // ตรวจสอบว่าเป็น admin หรือไม่
    if (role === "admin") {
      // Admin สามารถเข้าถึงข้อมูลทุกฟิลด์
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
        return res.status(404).json({ error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้" });
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

router.put("/:field_id", authMiddleware, async (req, res) => {
  try {
    const { field_id } = req.params;
    const { status } = req.body;
    const { user_id, role } = req.user;  // ดึงข้อมูลจาก token เพื่อเช็ค role ของผู้ใช้

    console.log("field_id ที่ได้รับ:", field_id);
    console.log("ข้อมูลที่ได้รับจาก Frontend:", req.body);

    if (!field_id || isNaN(field_id)) {
      console.log("field_id ไม่ถูกต้อง");
      return res.status(400).json({ error: "field_id ไม่ถูกต้อง" });
    }

    // ตรวจสอบว่า user เป็น admin หรือไม่
    if (role !== "admin") {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลนี้" });
    }

    // ตรวจสอบว่ามี field_id อยู่จริง
    const checkField = await pool.query("SELECT * FROM field WHERE field_id = $1", [field_id]);
    console.log("ข้อมูลจากฐานข้อมูล:", checkField.rows);

    if (checkField.rows.length === 0) {
      console.log("ไม่พบข้อมูลสนามกีฬาในฐานข้อมูล");
      return res.status(404).json({ error: "ไม่พบข้อมูลสนามกีฬา" });
    }

    const userData = await pool.query("SELECT * FROM users WHERE user_id = $1", [checkField.rows[0].user_id]);

   if (status === "ผ่านการอนุมัติ") {
    const userId = checkField.rows[0].user_id; 
    const userRole = checkField.rows[0].role;
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
        text: "สนามกีฬาได้รับการอนุมัติเรียบร้อยแล้ว",
      });
      console.log("อีเมลส่งสำเร็จ:", resultEmail);
    } catch (error) {
      console.log("ส่งอีเมลไม่สำเร็จ:", error);
      return res.status(500).json({ error: "ไม่สามารถส่งอีเมลได้", details: error.message });
    }
    
  }

  else if (status === "ไม่ผ่านการอนุมัติ") {
    const userId = checkField.rows[0].user_id; 
    const userRole = checkField.rows[0].role; 
    if(userRole === "field_owner") {
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
        text: "สนามกีฬาไม่ได้รับการอนุมัติ",
      });
      console.log("อีเมลส่งสำเร็จ:", resultEmail);
    } catch (error) {
      console.log("ส่งอีเมลไม่สำเร็จ:", error);
      return res.status(500).json({ error: "ไม่สามารถส่งอีเมลได้", details: error.message });
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
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตสนามกีฬา", details: error.message });
  }
});

// DELETE ลบสนามหลัก พร้อมลบ sub_field, add_on, โพส, รูป, เอกสาร
router.delete("/delete/field/:id", authMiddleware, async (req, res) => {
  const { id: fieldId } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ลบ add_on
    const subFields = await client.query("SELECT sub_field_id FROM sub_field WHERE field_id = $1", [fieldId]);
    for (const sub of subFields.rows) {
      await client.query("DELETE FROM add_on WHERE sub_field_id = $1", [sub.sub_field_id]);
    }

    // ลบ sub_field
    await client.query("DELETE FROM sub_field WHERE field_id = $1", [fieldId]);

    // ลบ post_images และไฟล์ภาพ
    const postImages = await client.query(
      `SELECT pi.image_url FROM post_images pi JOIN posts p ON pi.post_id = p.post_id WHERE p.field_id = $1`,
      [fieldId]
    );
    for (const img of postImages.rows) {
      const filePath = path.join(__dirname, "..", img.image_url);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error("Error deleting file:", e);
        }
      }
    }
    await client.query(`DELETE FROM post_images WHERE post_id IN (SELECT post_id FROM posts WHERE field_id = $1)`, [fieldId]);

    // ลบ posts
    await client.query("DELETE FROM posts WHERE field_id = $1", [fieldId]);

     // ดึง img_field และ documents เพื่อลบไฟล์แนบใน field
     const fieldFiles = await client.query("SELECT img_field, documents FROM field WHERE field_id = $1", [fieldId]);
     const { img_field, documents } = fieldFiles.rows[0] || {};
 
     if (img_field) {
       const imgPath = path.join(__dirname, "..", img_field);
       if (fs.existsSync(imgPath)) {
         try {
           fs.unlinkSync(imgPath);
         } catch (e) {
           console.error("Error deleting img_field:", e);
         }
       }
     }
 
     if (documents) {
      let docPaths = [];
    
      if (Array.isArray(documents)) {
        docPaths = documents;
      } else if (typeof documents === "string") {
        const cleaned = documents
          .replace(/^{|}$/g, "") // ตัด {} ข้างนอก
          .split(",") // แยกแต่ละ path
          .map((s) =>
            s.replace(/\\/g, "/").replace(/"/g, "").trim() // ลบ " และแก้ path
          );
    
        docPaths = cleaned;
      } else {
        docPaths = [documents.toString().replace(/\\/g, "/").replace(/"/g, "")];
      }
    
      for (const doc of docPaths) {
        const docPath = path.resolve(__dirname, "..", doc);
        if (fs.existsSync(docPath)) {
          try {
            fs.unlinkSync(docPath);
            console.log("ลบไฟล์สำเร็จ:", docPath);
          } catch (e) {
            console.error("ลบไฟล์เอกสารไม่สำเร็จ:", e);
          }
        } else {
          console.warn("ไม่พบไฟล์:", docPath);
        }
      }
    }
    
    
    
    // ลบ field
    await client.query("DELETE FROM field WHERE field_id = $1", [fieldId]);

    await client.query("COMMIT");
    res.status(200).json({ message: "Field, subfields, addons, posts, and images deleted successfully" });
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
    const { user_id, role } = req.user;  // ดึง user_id และ role จาก token ใน authMiddleware
    const { field_name, address, gps_location, open_hours, close_hours, price_deposit, name_bank, account_holder, number_bank, img_field, documents, field_description } = req.body;

    console.log("field_id ที่ได้รับ:", field_id);
    console.log("ข้อมูลที่ได้รับจาก Frontend:", req.body);

    if (!field_id || isNaN(field_id)) {
      console.log("field_id ไม่ถูกต้อง");
      return res.status(400).json({ error: "field_id ไม่ถูกต้อง" });
    }

    // ตรวจสอบว่ามี field_id อยู่จริงในฐานข้อมูล
    const checkField = await pool.query("SELECT * FROM field WHERE field_id = $1", [field_id]);
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
             field_description = COALESCE($12, field_description)
         WHERE field_id = $13
         RETURNING *;`,
        [field_name, address, gps_location, open_hours, close_hours, price_deposit, name_bank, account_holder, number_bank, img_field, documents, field_description, field_id]
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
             field_description = COALESCE($12, field_description)
         WHERE field_id = $13 AND user_id = $14
         RETURNING *;`,
        [field_name, address, gps_location, open_hours, close_hours, price_deposit, name_bank, account_holder, number_bank, img_field, documents, field_description, field_id, user_id]
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
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตสนามกีฬา", details: error.message });
  }
});

// สำหรับอัปโหลดรูปภาพ
router.post("/:field_id/upload-image", authMiddleware, upload.single("img_field"), async (req, res) => {
  try {
    const { field_id } = req.params;
    const filePath = req.file?.path; // รับ path ของไฟล์รูปภาพ

    if (!filePath) return res.status(400).json({ error: "ไม่พบไฟล์รูปภาพ" });

    const oldImg = await pool.query("SELECT img_field FROM field WHERE field_id = $1", [field_id]);
    const oldPath = oldImg.rows[0]?.img_field;

    if (oldPath && fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath); // ลบรูปเดิม
    }
    // อัปเดต path ของไฟล์ในฐานข้อมูล
    await pool.query(
      `UPDATE field SET img_field = $1 WHERE field_id = $2`,
      [filePath, field_id]
    );

    res.json({ message: "อัปโหลดรูปสำเร็จ", path: filePath });
  } catch (error) {
    console.error("Upload image error:", error);
    res.status(500).json({ error: "อัปโหลดรูปไม่สำเร็จ", details: error.message });
  }
});

router.post("/:field_id/upload-document", upload.array("documents", 10), authMiddleware, async (req, res) => {
  try {
    const { field_id } = req.params;

    // ตรวจสอบว่ามีไฟล์หรือไม่
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "ไม่พบไฟล์เอกสาร" });
    }
    
    const oldDocs = await pool.query("SELECT documents FROM field WHERE field_id = $1", [field_id]);
    const docPaths = oldDocs.rows[0]?.documents;
    
    if (docPaths) {
      const cleanedPaths = docPaths
        .replace(/^{|}$/g, "")
        .split(",")
        .map((p) => p.replace(/"/g, "").replace(/\\/g, "/").trim());
    
      cleanedPaths.forEach((doc) => {
        const fullPath = path.resolve(__dirname, "..", doc);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath); // ลบไฟล์แต่ละไฟล์
        }
      });
    }
    
    // บันทึกไฟล์ทุกไฟล์ที่อัปโหลด
    const filePaths = req.files.map(file => file.path);

    await pool.query(
      `UPDATE field SET documents = $1 WHERE field_id = $2`,
      [filePaths.join(", "), field_id] // เก็บ path ของไฟล์ที่อัปโหลดในฐานข้อมูล
    );

    res.json({ message: "✅ อัปโหลดเอกสารสำเร็จ", paths: filePaths });
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(500).json({ error: "อัปโหลดเอกสารไม่สำเร็จ", details: error.message });
  }
});

router.post("/subfield/:field_id",authMiddleware, async (req, res) => {
  const { field_id } = req.params;
  const { sub_field_name, price, sport_id, user_id } = req.body;

  // Validate sport_id
  if (!sport_id || isNaN(sport_id)) {
    return res.status(400).json({ error: "❌ กรุณาเลือกประเภทกีฬาก่อนเพิ่มสนาม" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sub_field (field_id, sub_field_name, price, sport_id, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [field_id, sub_field_name, price, sport_id, user_id]
    );

    res.json(result.rows[0]); // Return the new sub-field
  } catch (error) {
    console.error("❌ เพิ่ม sub_field ผิดพลาด:", error);
    res.status(500).json({ error: "❌ เพิ่ม sub_field ล้มเหลว" });
  }
});

router.post("/addon",authMiddleware, async (req, res) => {
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

    res.status(201).json(result.rows[0]); // ✅ ส่ง Add-on ใหม่กลับไป
  } catch (error) {
    console.error("❌ เพิ่ม Add-on ผิดพลาด:", error);
    res.status(500).json({ error: "❌ ไม่สามารถเพิ่ม Add-on ได้" });
  }
});


// Update sub-field
router.put("/supfiled/:sub_field_id",authMiddleware, async (req, res) => {
  const { sub_field_id } = req.params;
  const { sub_field_name, price, sport_id } = req.body;

  try {
    if (!sub_field_id) return res.status(400).json({ error: "❌ sub_field_id" });

    await pool.query(
      `UPDATE sub_field SET sub_field_name = $1, price = $2, sport_id = $3 WHERE sub_field_id = $4`,
      [sub_field_name, price, sport_id, sub_field_id]
    );
    res.json({ message: "สำเร็จ" });
  } catch (error) {
    console.error("❌ Error updating sub-field:", error);
    res.status(500).json({ error: "❌ เกิดข้อผิดพลาดในการอัปเดตข้อมูลสนามย่อย" });
  }
});

// Update add-on
router.put("/add_on/:add_on_id",authMiddleware, async (req, res) => {
  const { add_on_id } = req.params;
  const { content, price } = req.body;

  try {
    if (!add_on_id) return res.status(400).json({ error: "❌ add_on_id" });

    await pool.query(
      `UPDATE add_on SET content = $1, price = $2 WHERE add_on_id = $3`,
      [content, price, add_on_id]
    );
    res.json({ message: "สำเร็จ" });
  } catch (error) {
    console.error("❌ Error updating add-on:", error);
    res.status(500).json({ error: "❌ เกิดข้อผิดพลาดในการอัปเดต Add-on" });
  }
});

// Delete add-on handler
router.delete("/delete/addon/:id",authMiddleware, async (req, res) => {
  const addOnId = req.params.id;

  try {
    // Check if add-on exists before deleting
    const addOnQuery = await pool.query(
      "SELECT * FROM add_on WHERE add_on_id = $1",
      [addOnId]
    );

    if (addOnQuery.rows.length === 0) {
      return res.status(404).json({ error: "Add-On not found" });
    }

    // Proceed to delete the add-on
    await pool.query("DELETE FROM add_on WHERE add_on_id = $1", [addOnId]);

    return res.status(200).json({ message: "Add-On deleted successfully" });
  } catch (error) {
    console.error("Error deleting add-on:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/delete/subfield/:id",authMiddleware, async (req, res) => {
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
    await pool.query("DELETE FROM sub_field WHERE sub_field_id = $1", [subFieldId]);

    return res.status(200).json({ message: "Subfield deleted successfully" });
  } catch (error) {
    console.error("Error deleting subfield:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/open-days/:sub_field_id", async (req, res) => {
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

    const result = await pool.query(`SELECT * FROM field WHERE field_id = $1`, [
      field_id,
    ]);

    return res.status(200).json(
      result
    );
  } catch (error) {
    console.error("Error:", error);
    return res.status(404).json({ error: "Error Fetch Data" });
  }
});


module.exports = router;