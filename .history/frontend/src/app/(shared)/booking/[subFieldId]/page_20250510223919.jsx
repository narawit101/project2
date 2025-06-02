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
  let depositSlip = null;
  const client = await pool.connect();

  try {
    const {
      fieldId,
      userId,
      subFieldId,
      bookingDate,
      startTime,
      startDate,
      endTime,
      endDate,
      totalHours,
      totalPrice,
      payMethod,
      totalRemaining,
      activity,
      selectedFacilities,
      status
    } = JSON.parse(req.body.data);

    // ตรวจสอบไฟล์ (ยังไม่ลบ จนกว่าจะเกิด error)
    if (req.files["deposit_slip"]?.length > 0) {
      depositSlip = req.files["deposit_slip"][0].path;
    }

    // ตรวจสอบข้อมูลเบื้องต้น
    if (!fieldId || !userId || !subFieldId || !bookingDate || !startTime || !endTime || !totalHours || !totalPrice || !payMethod || totalRemaining === undefined || !activity) {
      if (depositSlip && fs.existsSync(depositSlip)) fs.unlinkSync(depositSlip);
      return res.status(400).json({ success: false, message: "กรุณาเลือกข้อมูลให้ครบ" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Invalid startDate or endDate" });
    }

    await client.query('BEGIN');
    const overlapResult = await client.query(
      `SELECT * FROM bookings
        WHERE sub_field_id = $1
          AND (
            (start_date || ' ' || start_time)::timestamp < $3::timestamp
            AND (end_date || ' ' || end_time)::timestamp > $2::timestamp
          )`,
      [
        subFieldId,
        `${startDate} ${startTime}`,
        `${endDate} ${endTime}`
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

    // Insert bookings
    const bookingResult = await client.query(
      `INSERT INTO bookings (field_id, user_id, sub_field_id, booking_date, start_time, end_time, total_hours, total_price, pay_method, total_remaining, activity, status,start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,$13 ,$14) RETURNING booking_id`,
      [fieldId, userId, subFieldId, bookingDate, startTime, endTime, totalHours, totalPrice, payMethod, totalRemaining, activity, status,startDate, endDate]
    );

    const bookingId = bookingResult.rows[0].booking_id;

    // insert facility
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
    if (depositSlip && fs.existsSync(depositSlip)) {
      fs.unlinkSync(depositSlip);
    }
    console.error('Error saving booking:', error);
    res.status(500).json({ success: false, message: error.message || 'Unexpected error' });
  } finally {
    client.release();
  }
});

router.get("/booked-range/:subFieldId/:startDate/:endDate", async (req, res) => {
  const { subFieldId, startDate, endDate } = req.params;

  try {
    const client = await pool.connect();

    const result = await client.query(
      `SELECT start_time, start_date, end_time, end_date, status
       FROM bookings
       WHERE sub_field_id = $1
         AND (
           (start_date || ' ' || start_time)::timestamp < ($3::date + interval '1 day')
           AND (end_date || ' ' || end_time)::timestamp > $2::date
         )
         AND status IN ('pending', 'approved')`,
      [subFieldId, startDate, endDate]
    );
    

    client.release();

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching booked range:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});



module.exports = router;