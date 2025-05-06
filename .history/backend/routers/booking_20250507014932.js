const express = require("express");
const pool = require("../db");
require("dotenv").config();
const router = express.Router();
const {Resend} = require("resend");
const resend = new Resend(process.env.Resend_API);
const multer = require("multer");
const path = require("path");
const fs = require("fs"); 

const storage = multer.diskStorage({
  destination: function (req, file, cd) {
    let uploadDir = "";
    if (file.fieldname === "deposit_slip") {
      uploadDir = "uploads/images/slip/"; // กำหนดโฟลเดอร์สำหรับไฟล์ deposit_slip
    }
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // สร้างโฟลเดอร์หากไม่มี
    }
    cd(null, uploadDir); // กำหนดโฟลเดอร์ปลายทาง
  },
  filename: function (req, file, cd) {
    cd(null, Date.now() + path.extname(file.originalname)); // กำหนดชื่อไฟล์ด้วย timestamp
  }
});

const upload = multer({
  storage: storage,
  limits: {
    files: 10,
    fileSize: 8 * 1024 * 1024, 
  },
});

router.post('/', upload.fields([{ name: "deposit_slip" }]), async (req, res) => {
  const { fieldId, userId, subFieldId, bookingDate, startTime, endTime, totalHours, totalPrice, payMethod, totalRemaining, activity, selectedFacilities, status } = JSON.parse(req.body.data);

  // ตรวจสอบการอัปโหลดไฟล์ deposit_slip
  const depositSlip = req.files["deposit_slip"] && req.files["deposit_slip"].length > 0 ? req.files["deposit_slip"][0].path : null;

  if (!fieldId || !userId || !subFieldId || !bookingDate || !startTime || !endTime || !totalHours || !totalPrice || !payMethod || totalRemaining === undefined || !activity) {
    return res.status(400).json({ success: false, message: "กรุณาเลือกข้อมูลให้ครบ" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const overlapResult = await client.query(
      `SELECT * FROM bookings
        WHERE sub_field_id = $1
          AND booking_date = $2
          AND (
            (start_time < end_time AND CAST($2 || ' ' || start_time AS timestamp) < CAST($4 AS timestamp) AND CAST($2 || ' ' || end_time AS timestamp) > CAST($3 AS timestamp))
            OR 
            (start_time > end_time AND CAST($2 || ' ' || start_time AS timestamp) < (CAST($4 AS timestamp) + INTERVAL '1 day') AND CAST($2 || ' ' || end_time AS timestamp) + INTERVAL '1 day' > CAST($3 AS timestamp))
          )`,
      [
        subFieldId, bookingDate, `${bookingDate} ${startTime}`, `${bookingDate} ${endTime}`
      ]
    );

    if (overlapResult.rows.length > 0) {
      if (depositSlip && fs.existsSync(depositSlip)) {
        fs.unlinkSync(depositSlip); // ลบไฟล์ที่ upload แล้ว
      }
      return res.status(400).json({
        success: false,
        message: "ช่วงเวลาที่เลือกมีผู้จองแล้ว กรุณาเลือกเวลาใหม่"
      });
    }

    // ✅ Insert bookings
    const bookingResult = await client.query(
      `INSERT INTO bookings (field_id, user_id, sub_field_id, booking_date, start_time, end_time, total_hours, total_price, pay_method, total_remaining, activity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING booking_id`,
      [fieldId, userId, subFieldId, bookingDate, startTime, endTime, totalHours, totalPrice, payMethod, totalRemaining, activity, status]
    );

    const bookingId = bookingResult.rows[0].booking_id;


    for (const facility of selectedFacilities) {
      await client.query(
        `INSERT INTO booking_fac (booking_id, field_fac_id, fac_name) 
         VALUES ($1, $2, $3) `,
        [bookingId, facility.field_fac_id, facility.fac_name]
      );
    }

    // เชื่อมต่อกับ payment
    if (depositSlip) {
      const paymentResult = await client.query(
        `INSERT INTO payment (booking_id, deposit_slip) VALUES ($1, $2) RETURNING payment_id`,
        [bookingId, depositSlip]
      );
    }

    await client.query('COMMIT');
    console.log('Booking saved successfully');
    res.status(200).json({ success: true, message: 'Booking saved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving booking:', error);
    res.status(500).json({ success: false, message: error.message || 'Unexpected error' });
  } finally {
    client.release();
  }
});

// GET /booking/booked-time/:subFieldId/:bookingDate
router.get("/booked-time/:subFieldId/:bookingDate", async (req, res) => {
  const { subFieldId, bookingDate } = req.params;

  try {
    const client = await pool.connect();

    const result = await client.query(
      `SELECT start_time, end_time, status
       FROM bookings
       WHERE sub_field_id = $1
         AND booking_date = $2
         AND status IN ('pending', 'approved')`, 
      [subFieldId, bookingDate]
    );

    client.release();

    res.status(200).json({
      success: true,
      data: result.rows, 
    });

  } catch (error) {
    console.error("Error fetching booked time:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});


module.exports = router;