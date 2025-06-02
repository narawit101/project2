const express = require("express");
const pool = require("../db");
require("dotenv").config();
const router = express.Router();
const { Resend } = require("resend");
const resend = new Resend(process.env.Resend_API);
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { error } = require("console");
const cron = require("node-cron");
const authMiddleware = require("../middlewares/auth");

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
  },
});

const upload = multer({
  storage: storage,
  limits: {
    files: 10,
    fileSize: 8 * 1024 * 1024,
  },
});

// ทำงานทุก 1 นาที
cron.schedule("0,30 * * * *", async () => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

  console.log("🔥 CRON WORKING", now.toISOString());

  try {
    const result = await pool.query(
      `
      SELECT b.*, u.email, f.field_name
      FROM bookings b
      JOIN users u ON u.user_id = b.user_id
      JOIN field f ON f.field_id = b.field_id
      WHERE b.status = 'pending' AND b.start_date = $1
    `,
      [todayStr]
    );

    console.log(`📦 พบการจองทั้งหมด ${result.rows.length} รายการ`);

    for (const booking of result.rows) {
      try {
        const rawTime = booking.start_time; // เช่น 12:30:00
        const todayDate = todayStr; // เช่น 2025-05-30
        const datetimeStr = `${todayDate}T${rawTime}+07:00`; // ครบชุดเวลา

        const startTime = new Date(datetimeStr); // เวลาจอง (ของวันนี้)
        const nowTime = new Date(
          `${todayDate}T${now.toTimeString().split(" ")[0]}+07:00`
        ); // เวลาปัจจุบัน

        if (isNaN(startTime.getTime())) {
          console.warn(
            `⚠️ ข้าม booking ${booking.booking_id} เพราะ startTime invalid`
          );
          continue;
        }

        const diffMinutes = (startTime - nowTime) / (1000 * 60);

        console.log(`🔍 ตรวจ booking: ${booking.booking_id}`);
        console.log(`🕒 startTime: ${startTime.toISOString()}`);
        console.log(`🕒 nowTime:   ${nowTime.toISOString()}`);
        console.log(`🧮 diff:      ${diffMinutes.toFixed(2)} นาที`);

        if (diffMinutes >= 29 && diffMinutes <= 31) {
          await resend.emails.send({
            from: process.env.Sender_Email,
            to: "surachai.up@rmuti.ac.th",
            subject: "⏰ ใกล้ถึงเวลาจองสนามแล้ว!",
            html: `
              <p>คุณมีการจองสนาม <strong>${booking.field_name}</strong></p>
              <p>เริ่มเวลา <strong>${booking.start_time}</strong> วันที่ <strong>${todayDate}</strong></p>
              <p>กรุณามาให้ตรงเวลา </p>
            `,
          });

          console.log(`📧 ส่งแจ้งเตือนสำเร็จ: ${booking.email}`);
        } else if (diffMinutes == 0) {
          await resend.emails.send({
            from: process.env.Sender_Email,
            to: "surachai.up@rmuti.ac.th",
            subject: "ถึงเวลาจองสนามแล้ว!",
            html: `
              <p>คุณมีการจองสนาม <strong>${booking.field_name}</strong></p>
              <p>เริ่มเวลา <strong>${booking.start_time}</strong> วันที่ <strong>${booking.start_date}</strong></p>
              <p>กรุณารีบมา </p>
            `,
          });
        } else {
          console.log(
            `⏳ ยังไม่ถึงเวลาแจ้งเตือน (เหลือ ${diffMinutes.toFixed(2)} นาที)`
          );
        }
      } catch (error) {
        console.warn(
          `⚠️ ข้าม booking ${booking.booking_id} เพราะ error:`,
          error.message
        );
      }
    }
  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาดใน CRON:", err);
  }
});

router.post(
  "/",
  authMiddleware,
  upload.fields([{ name: "deposit_slip" }]),
  async (req, res) => {
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
        selectedSlots,
        payMethod,
        totalRemaining,
        activity,
        selectedFacilities,
        status,
      } = JSON.parse(req.body.data);

      // ตรวจสอบไฟล์ (ยังไม่ลบ จนกว่าจะเกิด error)
      if (req.files["deposit_slip"]?.length > 0) {
        depositSlip = req.files["deposit_slip"][0].path;
      }

      // ตรวจสอบข้อมูลเบื้องต้น
      if (
        !fieldId ||
        !userId ||
        !subFieldId ||
        !bookingDate ||
        !startTime ||
        !endTime ||
        !totalHours ||
        !totalPrice ||
        !payMethod ||
        !selectedSlots ||
        totalRemaining === undefined ||
        !activity
      ) {
        if (depositSlip && fs.existsSync(depositSlip))
          fs.unlinkSync(depositSlip);
        return res
          .status(400)
          .json({ success: false, message: "กรุณาเลือกข้อมูลให้ครบ" });
      }

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid startDate or endDate" });
      }

      await client.query("BEGIN");
      const overlapResult = await client.query(
        `SELECT * FROM bookings
        WHERE sub_field_id = $1
          AND (
            (start_date || ' ' || start_time)::timestamp < $3::timestamp
            AND (end_date || ' ' || end_time)::timestamp > $2::timestamp
          )`,
        [subFieldId, `${startDate} ${startTime}`, `${endDate} ${endTime}`]
      );

      if (overlapResult.rows.length > 0) {
        if (depositSlip && fs.existsSync(depositSlip)) {
          fs.unlinkSync(depositSlip); // ลบไฟล์ที่ upload แล้ว
        }
        return res.status(400).json({
          success: false,
          message: "ช่วงเวลาที่เลือกมีผู้จองแล้ว กรุณาเลือกเวลาใหม่",
        });
      }

      // Insert bookings
      const bookingResult = await client.query(
        `INSERT INTO bookings (field_id, user_id, sub_field_id, booking_date, start_time, end_time, total_hours, total_price, pay_method, total_remaining, activity, status, start_date, end_date, selected_slots)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING booking_id`,
        [
          fieldId,
          userId,
          subFieldId,
          bookingDate,
          startTime,
          endTime,
          totalHours,
          totalPrice,
          payMethod,
          totalRemaining,
          activity,
          status,
          startDate,
          endDate,
          selectedSlots,
        ]
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

      await client.query("COMMIT");
      console.log("🔔 emitting slot_booked", bookingId);
      if (req.io) {
        req.io.emit("slot_booked", {
          bookingId,
        });
      }

      console.log("Booking saved successfully");
      res
        .status(200)
        .json({ success: true, message: "Booking saved successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      if (depositSlip && fs.existsSync(depositSlip)) {
        fs.unlinkSync(depositSlip);
      }
      console.error("Error saving booking:", error);
      res
        .status(500)
        .json({ success: false, message: error.message || "Unexpected error" });
    } finally {
      client.release();
    }
  }
);

router.get(
  "/booked-block/:subFieldId/:startDate/:endDate",
  authMiddleware,
  async (req, res) => {
    const { subFieldId, startDate, endDate } = req.params;

    try {
      const client = await pool.connect();
      const result = await client.query(
        `SELECT *
       FROM bookings
       where booking_date = $2   and sub_field_id = $1 
         AND status IN ('pending', 'approved')
      `,
        [subFieldId, startDate]
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
  }
);

router.get("/my-bookings/:user_id", authMiddleware, async (req, res) => {
  const { user_id } = req.params;
  const { date, status } = req.query;

  let query = `
    SELECT 
      b.booking_id,
      b.user_id,
      b.field_id,
      u.first_name,
      u.last_name,
      u.email,
      f.field_name,
      f.gps_location,
      f.price_deposit,
      f.cancel_hours,
      b.sub_field_id,
      sf.sub_field_name,
      sf.price,
      b.booking_date,
      b.start_date,
      b.start_time,
      b.end_date,
      b.end_time,
      b.total_hours,
      b.total_price,
      b.total_remaining,
      b.pay_method,
      b.status,
      b.activity,
      b.selected_slots,
      bf.fac_name AS facility_name,
      bf.field_fac_id
    FROM bookings b
    LEFT JOIN field f ON b.field_id = f.field_id
    LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
    LEFT JOIN booking_fac bf ON bf.booking_id = b.booking_id
    INNER JOIN users u ON u.user_id = b.user_id
    WHERE b.user_id = $1
  `;

  let values = [user_id];
  let i = 2;

  if (date) {
    query += ` AND b.start_date = $${i}`;
    values.push(date);
    i++;
  }

  if (status) {
    query += ` AND b.status = $${i}`;
    values.push(status);
    i++;
  }

  query += ` ORDER BY b.booking_date DESC`;

  try {
    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      error: "Not Found Your booking",
    });
  }
});


router.get("/my-orders/:field_id", authMiddleware, async (req, res) => {
  const { field_id } = req.params;
  const { date, status } = req.query;
  const user_id = req.user.user_id;
  const user_role = req.user.role; // เช่น 'user', 'admin'

  try {
    // 1. ถ้าไม่ใช่ admin → ตรวจสอบว่า user นี้เป็นเจ้าของสนาม
    if (user_role !== "admin") {
      const fieldCheck = await pool.query(
        `SELECT user_id FROM field WHERE field_id = $1`,
        [field_id]
      );

      if (fieldCheck.rowCount === 0) {
        return res.status(404).json({ success: false, error: "Field not found" });
      }

      const fieldOwnerId = fieldCheck.rows[0].user_id;

      if (fieldOwnerId !== user_id) {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
    }

    // 2. สร้าง query สำหรับ booking (ตาม date, status ที่ส่งมา)
    let query = `
      SELECT 
        b.booking_id, b.user_id, b.field_id,
        u.first_name, u.last_name, u.email,
        f.field_name, f.gps_location, f.price_deposit, f.cancel_hours,
        b.sub_field_id, sf.sub_field_name, sf.price,
        b.booking_date, b.start_date, b.start_time, b.end_date, b.end_time,
        b.total_hours, b.total_price, b.total_remaining,
        b.pay_method, b.status, b.activity, b.selected_slots
      FROM bookings b
      LEFT JOIN field f ON b.field_id = f.field_id
      LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
      INNER JOIN users u ON u.user_id = b.user_id
      WHERE b.field_id = $1
    `;

    let values = [field_id];
    let i = 2;

    if (date) {
      query += ` AND b.start_date = $${i}`;
      values.push(date);
      i++;
    }

    if (status) {
      query += ` AND b.status = $${i}`;
      values.push(status);
      i++;
    }

    query += ` ORDER BY b.booking_date DESC`;

    const result = await pool.query(query, values);
    res.status(200).json({ success: true, data: result.rows });

  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, error: "Failed to get bookings" });
  }
});



router.get("/bookings-detail/:booking_id", authMiddleware, async (req, res) => {
  const { booking_id } = req.params;
  const requestingUser = req.user;

  try {
    // ดึงข้อมูลการจองก่อน
    const result = await pool.query(
      `
      SELECT 
        b.booking_id,
        b.user_id,
        b.field_id,
        u.first_name,
        u.last_name,
        u.email,
        f.field_name,
        f.gps_location,
        f.price_deposit,
        f.cancel_hours,
        b.sub_field_id,
        sf.sub_field_name,
        sf.price,
        b.booking_date,
        b.start_date,
        b.start_time,
        b.end_date,
        b.end_time,
        b.total_hours,
        b.total_price,
        b.total_remaining,
        b.pay_method,
        b.status,
        b.activity,
        b.selected_slots,
        bf.fac_name AS facility_name,
        bf.field_fac_id,
        p.*
      FROM bookings b
      LEFT JOIN field f ON b.field_id = f.field_id
      LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
      LEFT JOIN booking_fac bf ON bf.booking_id = b.booking_id
      LEFT JOIN users u ON u.user_id = b.user_id
      LEFT JOIN payment p ON p.booking_id = b.booking_id
      WHERE b.booking_id = $1
      LIMIT 1;
      `,
      [booking_id]
    );

    const booking = result.rows[0];

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "ไม่พบข้อมูลการจองนี้",
      });
    }

    // สิทธิ์ admin ดูได้หมด
    if (requestingUser.role === "admin") {
      return res.status(200).json({ success: true, data: booking });
    }

    // สิทธิ์ user → ต้องเป็นเจ้าของการจอง
    if (requestingUser.role === "user" && requestingUser.user_id !== booking.user_id) {
      return res.status(403).json({
        success: false,
        error: "คุณไม่มีสิทธิ์ดูข้อมูลการจองนี้",
      });
    }

    // สิทธิ์เจ้าของสนาม → ตรวจสอบว่าเป็นเจ้าของ field นี้
    if (requestingUser.role === "field_owner") {
      const ownerResult = await pool.query(
        `SELECT * FROM field WHERE field_id = $1 AND owner_id = $2`,
        [booking.field_id, requestingUser.user_id]
      );

      if (ownerResult.rowCount === 0) {
        return res.status(403).json({
          success: false,
          error: "คุณไม่มีสิทธิ์ดูการจองนี้ เพราะไม่ใช่เจ้าของสนาม",
        });
      }
    }

    // ถ้าผ่านทุกเงื่อนไข
    res.status(200).json({ success: true, data: booking });

  } catch (error) {
    console.error("Error fetching booking detail:", error);
    res.status(500).json({
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูล",
    });
  }
});



router.put("/booking-status/:booking_id",authMiddleware, async (req, res) => {
  const { booking_id } = req.params;
  const { booking_status } = req.body;
  try {
    const result = await pool.query(
      "UPDATE bookings SET status = $1 WHERE booking_id = $2",
      [booking_status, booking_id]
    );
    return res.status(200).json({ status: 1, data: result.rows });
  } catch (error) {
    console.log("error");
    res.status(500).json({ status: 0, data: "error" });
  }
});

router.delete("/cancel-bookings/:booking_id",authMiddleware, async (req, res) => {
  const { booking_id } = req.params; // รับ booking_id จาก URL
  const { cancel_time } = req.body; // รับเวลายกเลิกจาก frontend

  try {
    // ✅ ตรวจสอบว่า cancel_time ถูกส่งมาหรือไม่
    if (!cancel_time) {
      return res.status(400).json({
        status: 0,
        message: "Missing cancel_time in request body.",
      });
    }

    // ✅ แปลง cancel_time เป็น Date object
    const now = new Date(cancel_time);

    // ✅ ตรวจสอบว่าเป็นวันเวลาที่ valid ไหม
    if (isNaN(now.getTime())) {
      return res.status(400).json({
        status: 0,
        message: "Invalid cancel_time format. Must be ISO string.",
      });
    }

    console.log(`📌 ยกเลิก booking_id = ${booking_id}`);
    console.log(`🕒 เวลาที่กดปุ่ม cancel: ${now.toISOString()}`);

    // ✅ ดึงข้อมูลจาก database
    const fieldDataResult = await pool.query(
      `
      SELECT f.cancel_hours, b.start_date, b.start_time, f.field_name
      FROM bookings b
      JOIN field f ON b.field_id = f.field_id
      WHERE b.booking_id = $1
    `,
      [booking_id]
    );

    if (fieldDataResult.rowCount === 0) {
      return res.status(404).json({
        status: 0,
        message: `Booking ID ${booking_id} not found.`,
        timestamp: now.toISOString(),
      });
    }

    const { cancel_hours, start_date, start_time, field_name } =
      fieldDataResult.rows[0];

    if (cancel_hours === null) {
      await pool.query(`DELETE FROM booking_fac WHERE booking_id = $1`, [
        booking_id,
      ]);
      await pool.query(`DELETE FROM bookings WHERE booking_id = $1`, [
        booking_id,
      ]);

      return res.status(200).json({
        status: 1,
        message: `Booking for ${field_name} at ${start_time} on ${start_date.toISOString().slice(0, 10)} canceled successfully.`,
        cancelDeadline: null,
        now: now.toISOString(),
      });
    } else {
      // ✅ แปลงวันที่ให้เป็น string ถ้าไม่ใช่ Date object
      const startDateStr = start_date.toISOString().slice(0, 10);

      // ✅ รวม date + time เป็น full datetime พร้อม timezone ไทย (+07:00)
      const startDateTime = new Date(`${startDateStr}T${start_time}+07:00`);

      // ✅ คำนวณเส้นตายยกเลิก
      const cancelDeadline = new Date(
        startDateTime.getTime() - cancel_hours * 60 * 60 * 1000
      );

      console.log(`📆 เวลาเริ่มเล่น: ${startDateTime.toISOString()}`);
      console.log(`⏳ เส้นตายยกเลิก: ${cancelDeadline.toISOString()}`);

      // ✅ เปรียบเทียบ cancel_time < cancelDeadline
      if (now < cancelDeadline) {
        await pool.query(`DELETE FROM booking_fac WHERE booking_id = $1`, [
          booking_id,
        ]);
        await pool.query(`DELETE FROM bookings WHERE booking_id = $1`, [
          booking_id,
        ]);

        return res.status(200).json({
          status: 1,
          message: `Booking for ${field_name} at ${start_time} on ${startDateStr} canceled successfully.`,
          cancelDeadline: cancelDeadline.toISOString(),
          now: now.toISOString(),
        });
      } else {
        // ยกเลิกไม่ทันเวลา
        return res.status(400).json({
          status: 0,
          message: `Cannot cancel booking. You must cancel at least ${cancel_hours} hours before.`,
          field: field_name,
          startDateTime: startDateTime.toISOString(),
          cancelDeadline: cancelDeadline.toISOString(),
          now: now.toISOString(),
        });
      }
    }
  } catch (error) {
    console.error("❌ Error while canceling booking:", error);

    return res.status(500).json({
      status: 0,
      message: "Internal Server Error",
      error: error.message,
      booking_id,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
