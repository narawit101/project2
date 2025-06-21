module.exports = function (io) {
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
  const { CloudinaryStorage } = require("multer-storage-cloudinary");
  const cloudinary = require("../server");

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      let folder = "";
      let resourceType = "auto"; // ค่าเริ่มต้น
      let format = undefined; // ปล่อยให้ Cloudinary จัดการ

      if (file.fieldname === "deposit_slip") {
        folder = "uploads/images/slip/deposit_slip"; // กำหนดโฟลเดอร์สำหรับไฟล์ deposit_slip
      } else if (file.fieldname === "total_slip") {
        folder = "uploads/images/slip/total_slip"; // โฟลเดอร์สำหรับรูปภาพ
      }

      const config = {
        folder: folder,
        resource_type: resourceType,
        public_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // เพิ่ม format เฉพาะเมื่อจำเป็น
      if (format) {
        config.format = format;
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

  const upload = multer({
    storage: storage,
    limits: {
      files: 10,
      fileSize: 8 * 1024 * 1024,
    },
  });

  async function deleteCloudinaryFile(fileUrl) {
    if (!fileUrl) return;

    try {
      const urlParts = fileUrl.split("/");
      const uploadIndex = urlParts.findIndex((part) => part === "upload");
      if (uploadIndex === -1) return;

      let pathStartIndex = uploadIndex + 1;
      if (urlParts[pathStartIndex].startsWith("v")) {
        pathStartIndex++;
      }

      const pathParts = urlParts.slice(pathStartIndex);
      const fullPath = pathParts.join("/");
      const isRaw = fileUrl.includes("/raw/");

      const resourceType = isRaw ? "raw" : "image";
      const lastDotIndex = fullPath.lastIndexOf(".");
      const publicId = isRaw ? fullPath : fullPath.substring(0, lastDotIndex);

      const result = await uploader.destroy(publicId, {
        resource_type: resourceType,
      });

      console.log("Deleted from Cloudinary:", publicId, result);
    } catch (err) {
      console.error("Failed to delete Cloudinary file:", err);
    }
  }

  cron.schedule("*/5 * * * *", async () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    console.log(" CRON WORKING", now.toISOString());

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

      console.log(` พบการจองทั้งหมด ${result.rows.length} รายการ`);

      for (const booking of result.rows) {
        try {
          const rawTime = booking.start_time;
          const datetimeStr = `${todayStr}T${rawTime}+07:00`;

          const startTime = new Date(datetimeStr);
          const nowTime = new Date(
            `${todayStr}T${now.toTimeString().split(" ")[0]}+07:00`
          );

          const diffMinutes = (startTime - nowTime) / (1000 * 60);

          console.log(` ตรวจ booking: ${booking.booking_id}`);
          console.log(` startTime: ${startTime.toISOString()}`);
          console.log(` nowTime:   ${nowTime.toISOString()}`);
          console.log(` diff:      ${diffMinutes.toFixed(2)} นาที`);

          if (diffMinutes >= 29 && diffMinutes <= 31) {
            await resend.emails.send({
              from: process.env.Sender_Email,
              to: booking.email,
              subject: "ใกล้ถึงเวลาจองสนามแล้ว!",
              html: `
                    <div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1f2937; margin-bottom: 16px;">แจ้งเตือนล่วงหน้า</h2>
              <p style="font-size: 16px; color: #111827;">
                คุณมีการจองสนาม <strong>${booking.field_name}</strong>
              </p>
              <p style="font-size: 16px; color: #111827;">
                เวลาเริ่มต้น: <strong>${booking.start_time}</strong> <br/>
                วันที่: <strong>${todayStr}</strong>
              </p>
              <p style="font-size: 14px; color: #6b7280;">
                กรุณามาถึงสนามก่อนเวลาเพื่อเตรียมตัวล่วงหน้า
              </p>
            </div>
            `,
            });

            console.log(` แจ้งเตือนล่วงหน้าแล้ว: ${booking.email}`);
          } else if (diffMinutes === 0) {
            await resend.emails.send({
              from: process.env.Sender_Email,
              to: booking.email,
              subject: "ถึงเวลาจองสนามแล้ว!",
              html: `
                  <div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin-bottom: 16px;">ถึงเวลาเริ่มต้นการจองแล้ว</h2>
          <p style="font-size: 16px; color: #111827;">
            สนามที่จอง: <strong>${booking.field_name}</strong>
          </p>
          <p style="font-size: 16px; color: #111827;">
            เริ่มเวลา: <strong>${booking.start_time}</strong> <br/>
            วันที่: <strong>${booking.start_date}</strong>
          </p>
          <p style="font-size: 14px; color: #6b7280;">
            ขอให้คุณมีความสุขกับการใช้งานสนาม และขอขอบคุณที่ใช้บริการของเรา
          </p>
        </div>
            `,
            });

            console.log(` แจ้งเตือนเริ่มเตะ: ${booking.email}`);
          } else {
            console.log(
              ` ยังไม่ถึงเวลาแจ้งเตือน (${diffMinutes.toFixed(2)} นาที)`
            );
          }
        } catch (error) {
          console.warn(
            ` ข้าม booking ${booking.booking_id} เพราะ error:`,
            error.message
          );
        }
      }

      const expired = await pool.query(`
            DELETE FROM bookings b
            USING users u, field f
            WHERE b.user_id = u.user_id
              AND b.field_id = f.field_id
              AND b.status = 'approved'
              AND b.status = 'complete'
              AND f.price_deposit > 0
              AND b.booking_id NOT IN (SELECT booking_id FROM payment)
              AND (
                NOW() > b.updated_at + INTERVAL '60 minutes'
                OR (
                  b.updated_at > (b.start_date || ' ' || b.start_time)::timestamp - INTERVAL '10 minutes'
                  AND NOW() >= (b.start_date || ' ' || b.start_time)::timestamp
                )
              )
            RETURNING b.booking_id, u.email, f.field_name, b.start_time, b.start_date;
`);

      if (expired.rows.length > 0) {
        for (const row of expired.rows) {
          await resend.emails.send({
            from: process.env.Sender_Email,
            to: row.email,
            subject: "การจองสนามของคุณถูกยกเลิกอัตโนมัติ",
            html: `
            <p>ระบบได้ยกเลิกการจองสนาม <strong>${row.field_name}</strong></p>
            <p>เวลา: <strong>${row.start_time}</strong> วันที่ <strong>${row.start_date}</strong></p>
            <p>เพราะไม่ได้แนบสลิปค่ามัดจำภายในเวลาที่กำหนด</p>
          `,
          });
          console.log(` ส่งแจ้งเตือนการลบไปยัง ${row.email}`);
          if (io) {
            io.emit("slot_booked", {
              bookingId: row.booking_id,
            });
          }
        }

        console.log(` ลบ booking หมดอายุทั้งหมด ${expired.rows.length} รายการ`);
      } else {
        console.log(" ไม่มี booking ที่ต้องลบ");
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดใน CRON:", err.message);
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

        if (req.files["deposit_slip"]?.length > 0) {
          depositSlip = req.files["deposit_slip"][0].path;
        }

        if (
          !fieldId ||
          !userId ||
          !subFieldId ||
          !bookingDate ||
          !startTime ||
          !endTime ||
          !totalHours ||
          // !totalPrice ||
          // !payMethod ||
          !selectedSlots ||
          totalRemaining === undefined ||
          !activity
        ) {
          if (depositSlip) await deleteCloudinaryFile(depositSlip);
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
            AND status NOT IN ('rejected')
            AND (
              (start_date || ' ' || start_time)::timestamp < $3::timestamp
              AND (end_date || ' ' || end_time)::timestamp > $2::timestamp
            )`,
          [subFieldId, `${startDate} ${startTime}`, `${endDate} ${endTime}`]
        );

        if (overlapResult.rows.length > 0) {
          if (depositSlip) {
            await deleteCloudinaryFile(depositSlip); // ลบไฟล์ที่ upload แล้ว
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
        console.log(" emitting slot_booked", bookingId);
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
        if (depositSlip) {
          await deleteCloudinaryFile(depositSlip);
        }
        console.error("Error saving booking:", error);
        res.status(500).json({
          success: false,
          message: error.message || "Unexpected error",
        });
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
         WHERE sub_field_id = $1
         AND booking_date >= $2
         AND booking_date < $3
         AND status IN ('pending', 'approved', 'complete')`,
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
    }
  );

  router.get("/my-bookings/:user_id", authMiddleware, async (req, res) => {
    const { user_id } = req.params;
    const { date, status } = req.query;

    try {
      // 1. ดึงข้อมูลผู้ใช้ก่อน
      const userResult = await pool.query(
        `SELECT user_name, first_name, last_name FROM users WHERE user_id = $1`,
        [user_id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "ไม่พบผู้ใช้",
        });
      }

      const userInfo = userResult.rows[0];

      let query = `
      SELECT 
        b.booking_id,
        b.user_id,
        b.field_id,
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
        (
  SELECT COALESCE(json_agg(jsonb_build_object(
    'field_fac_id', bf.field_fac_id,
    'fac_name', bf.fac_name,
    'fac_price', ff.fac_price
  )), '[]')
  FROM booking_fac bf
  LEFT JOIN field_facilities ff ON ff.field_fac_id = bf.field_fac_id
  WHERE bf.booking_id = b.booking_id
) AS facilities
      FROM bookings b
      LEFT JOIN field f ON b.field_id = f.field_id
      LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
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

      query += ` ORDER BY b.booking_date ASC, b.start_time ASC`;

      const bookingResult = await pool.query(query, values);

      // ส่งกลับ user + bookings แม้จะไม่มี booking ก็มีชื่อ
      res.status(200).json({
        success: true,
        user: userInfo, // ✅ ชื่อผู้ใช้
        data: bookingResult.rows, // ✅ การจอง (อาจว่าง)
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({
        success: false,
        error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    }
  });

  // แก้ไข API Route สำหรับรองรับ Date Range Filter
  router.get("/my-orders/:field_id", authMiddleware, async (req, res) => {
    const { field_id } = req.params;
    // แก้ไขรับ startDate และ endDate แทน date
    const { startDate, endDate, status, bookingDate } = req.query;
    const user_id = req.user.user_id;
    const user_role = req.user.role;

    try {
      // 1. ถ้าไม่ใช่ admin → ตรวจสอบว่า user นี้เป็นเจ้าของสนาม
      const fieldQuery = await pool.query(
        `SELECT user_id, field_name, status AS field_status FROM field WHERE field_id = $1`,
        [field_id]
      );

      if (fieldQuery.rowCount === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Field not found" });
      }

      const field = fieldQuery.rows[0];

      if (user_role !== "admin" && field.user_id !== user_id) {
        return res
          .status(403)
          .json({ success: false, error: "ไม่มีสิทธิ์ดูข้อมูล" });
      }

      if (field.field_status !== "ผ่านการอนุมัติ") {
        return res.status(403).json({
          success: false,
          error: `สนาม ${field.field_name} ${field.field_status}`,
          fieldInfo: {
            field_name: field.field_name,
            field_status: field.field_status,
          },
        });
      }

      let query = `
SELECT 
  b.booking_id, b.user_id, b.field_id,
  u.first_name, u.last_name, u.email,
  f.field_name, f.gps_location, f.price_deposit, f.cancel_hours, f.status AS field_status,
  b.sub_field_id, sf.sub_field_name, sf.price AS sub_field_price,
  b.booking_date, b.start_date, b.start_time, b.end_date, b.end_time,
  b.total_hours, b.total_price, b.total_remaining,
  b.pay_method, b.status, b.activity, b.selected_slots,

  -- รวม facility เฉพาะของ booking นั้น
(
  SELECT COALESCE(json_agg(jsonb_build_object(
    'field_fac_id', bf.field_fac_id,
    'fac_name', bf.fac_name,
    'fac_price', ff.fac_price
  )), '[]')
  FROM booking_fac bf
  LEFT JOIN field_facilities ff ON ff.field_fac_id = bf.field_fac_id
  WHERE bf.booking_id = b.booking_id
) AS facilities
FROM bookings b
INNER JOIN users u ON u.user_id = b.user_id
LEFT JOIN field f ON b.field_id = f.field_id
LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
WHERE b.field_id = $1
    `;

      let values = [field_id];
      let paramIndex = 2;

      if (bookingDate) {
        query += ` AND b.booking_date= $${paramIndex}`;
        values.push(bookingDate);
        paramIndex++;
      }
      // แก้ไขการกรองวันที่แบบช่วง
      else if (startDate && endDate) {
        // กรองแบบช่วงวันที่
        query += ` AND b.start_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        values.push(startDate, endDate);
        paramIndex += 2;
      } else if (startDate) {
        // กรองตั้งแต่วันที่เริ่มต้นขึ้นไป
        query += ` AND b.start_date >= $${paramIndex}`;
        values.push(startDate);
        paramIndex++;
      } else if (endDate) {
        // กรองจนถึงวันที่สิ้นสุด
        query += ` AND b.start_date <= $${paramIndex}`;
        values.push(endDate);
        paramIndex++;
      }

      if (status) {
        query += ` AND b.status = $${paramIndex}`;
        values.push(status);
        paramIndex++;
      }

      query += ` ORDER BY b.booking_date ASC, b.start_time ASC`;

      const result = await pool.query(query, values);

      // คำนวณสถิติเพิ่มเติมสำหรับรายงาน
      const stats = {
        totalBookings: result.rows.length,
        statusCounts: {
          pending: result.rows.filter((row) => row.status === "pending").length,
          approved: result.rows.filter((row) => row.status === "approved")
            .length,
          rejected: result.rows.filter((row) => row.status === "rejected")
            .length,
        },
        totalRevenue: result.rows
          .filter((row) => row.status === "approved")
          .reduce((sum, row) => sum + parseFloat(row.total_price || 0), 0),
        // totalDeposit: result.rows
        //   .filter(row => row.status === 'approved')
        //   .reduce((sum, row) => sum + parseFloat(row.price_deposit || 0), 0)
      };

      res.status(200).json({
        success: true,
        data: result.rows,
        fieldInfo: {
          field_name: field.field_name,
          field_status: field.field_status,
        },
        stats: stats,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ success: false, error: "Failed to get bookings" });
    }
  });

  router.get(
    "/bookings-detail/:booking_id",
    authMiddleware,
    async (req, res) => {
      const { booking_id } = req.params;
      const requestingUser = req.user;

      try {
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
  f.user_id AS field_user_id,
  f.name_bank,
  f.account_holder,
  f.number_bank, 
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
  p.deposit_slip,
  p.total_slip,
  facs.facilities  -- ✅ เพิ่มตรงนี้
FROM bookings b
LEFT JOIN field f ON b.field_id = f.field_id
LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
LEFT JOIN users u ON u.user_id = b.user_id

-- ✅ JOIN ข้อมูลการชำระเงินล่าสุด
LEFT JOIN LATERAL (
  SELECT deposit_slip, total_slip
  FROM payment
  WHERE booking_id = b.booking_id
  ORDER BY payment_id DESC
  LIMIT 1
) p ON true

-- ✅ JOIN facilities แบบ LATERAL
LEFT JOIN LATERAL (
  SELECT COALESCE(json_agg(jsonb_build_object(
    'field_fac_id', bf.field_fac_id,
    'fac_name', bf.fac_name,
    'fac_price', ff.fac_price
  )), '[]') AS facilities
  FROM booking_fac bf
  LEFT JOIN field_facilities ff ON ff.field_fac_id = bf.field_fac_id
  WHERE bf.booking_id = b.booking_id
) facs ON true

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

        const isAdmin = requestingUser.role === "admin";
        const isBookingOwner = requestingUser.user_id === booking.user_id;
        const isFieldOwner = requestingUser.user_id === booking.field_user_id;

        if (!isAdmin && !isBookingOwner && !isFieldOwner) {
          return res.status(403).json({
            success: false,
            error: "คุณไม่มีสิทธิ์ดูข้อมูลการจองนี้",
          });
        }

        return res.status(200).json({ success: true, data: booking });
      } catch (error) {
        console.error("Error fetching booking detail:", error);
        return res.status(500).json({
          success: false,
          error: "เกิดข้อผิดพลาดในการดึงข้อมูล",
        });
      }
    }
  );

  router.put(
    "/booking-status/:booking_id",
    authMiddleware,
    async (req, res) => {
      const { booking_id } = req.params;
      const { booking_status } = req.body;

      try {
        let result;

        // ✅ อัปเดตสถานะ และ updated_at ถ้า approved
        if (booking_status === "approved") {
          result = await pool.query(
            "UPDATE bookings SET status = $1, updated_at = NOW() WHERE booking_id = $2 RETURNING *",
            [booking_status, booking_id]
          );
        } else {
          result = await pool.query(
            "UPDATE bookings SET status = $1 WHERE booking_id = $2 RETURNING *",
            [booking_status, booking_id]
          );
        }

        if (result.rowCount === 0) {
          return res.status(404).json({
            success: false,
            error: "ไม่พบ booking ที่ต้องการอัปเดต",
          });
        }

        const booking = result.rows[0];

        const userInfoRes = await pool.query(
          `SELECT u.email, f.field_name
       FROM bookings b
       JOIN users u ON b.user_id = u.user_id
       JOIN field f ON b.field_id = f.field_id
       WHERE b.booking_id = $1`,
          [booking_id]
        );

        const userInfo = userInfoRes.rows[0];

        if (userInfo) {
          let subject = "";
          let message = "";

          if (booking_status === "approved") {
            subject = `การจองสนาม ${userInfo.field_name} ได้รับการอนุมัติแล้ว`;
            message = `
         <div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
  <h2 style="color: #1d4ed8; margin-bottom: 16px;">การจองของคุณได้รับการอนุมัติแล้ว!</h2>

  <p style="font-size: 16px; color: #111827;">
    การจองสนาม <strong style="color: #0f172a;">${userInfo.field_name}</strong> ของคุณได้รับการอนุมัติแล้ว
  </p>

  <div style="margin: 20px 0;">
    <a
      href="${process.env.FONT_END_URL}/login?redirect=/bookingDetail/${booking_id}"
      style="display: inline-block; background-color: #1d4ed8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;"
      target="_blank"
    >
      ดูรายละเอียดการจอง #${booking_id}
    </a>
  </div>

  <p style="font-size: 14px; color: #6b7280;">
    กรุณาแนบสลิปมัดจำ <strong>(ถ้ามี)</strong> ภายใน <strong>1 ชั่วโมง</strong> หลังจากได้รับการอนุมัติ มิฉะนั้นระบบจะยกเลิกการจองโดยอัตโนมัติ
  </p>

  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="font-size: 12px; color: #9ca3af;">
    หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  </p>
</div>

        `;
          } else if (booking_status === "rejected") {
            subject = `การจองสนาม ${userInfo.field_name} ไม่ได้รับการอนุมัติ`;
            message = `
   <div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
  <h2 style="color: #1d4ed8; margin-bottom: 16px;">การจองของคุณไม่ได้รับการอนุมัติ!</h2>

  <p style="font-size: 16px; color: #111827;">
    การจองสนาม <strong style="color: #0f172a;">${userInfo.field_name}</strong> ของคุณไม่ได้รับการอนุมัติ
  </p>

  <div style="margin: 20px 0;">
    <a
      href="${process.env.FONT_END_URL}/login?redirect=/bookingDetail/${booking_id}"
      style="display: inline-block; background-color: #1d4ed8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;"
      target="_blank"
    >
      ดูรายละเอียดการจอง #${booking_id}
    </a>
  </div>
  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <p style="font-size: 12px; color: #9ca3af;">
    หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
  </p>
</div>
`;
          }

          if (subject) {
            await resend.emails.send({
              from: process.env.Sender_Email,
              to: userInfo.email,
              subject,
              html: message,
            });

            console.log(
              `📧 ส่งอีเมลแจ้งผลการอัปเดตสถานะไปยัง ${userInfo.email}`
            );
          }
        }

        // ✅ ส่ง socket event แจ้งหน้าเว็บ
        req.io.emit("slot_booked", {
          bookingId: booking_id,
        });

        return res.status(200).json({
          success: true,
          message: "อัปเดตสถานะสำเร็จ",
          data: booking,
        });
      } catch (error) {
        console.error("Error updating booking status:", error);
        return res.status(500).json({
          success: false,
          error: "เกิดข้อผิดพลาดในระบบ",
        });
      }
    }
  );

  router.delete(
    "/cancel-bookings/:booking_id",
    authMiddleware,
    async (req, res) => {
      const { booking_id } = req.params;
      const { cancel_time } = req.body;

      try {
        // ✅ ตรวจ cancel_time
        if (!cancel_time) {
          return res.status(400).json({
            status: 0,
            message: "Missing cancel_time in request body.",
          });
        }

        const now = new Date(cancel_time);
        if (isNaN(now.getTime())) {
          return res.status(400).json({
            status: 0,
            message: "Invalid cancel_time format. Must be ISO string.",
          });
        }

        console.log(` ยกเลิก booking_id = ${booking_id}`);
        console.log(` เวลาที่กดปุ่ม cancel: ${now.toISOString()}`);

        // ✅ ดึงข้อมูลการจอง
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

        // ✅ ตรวจและแปลง start_date
        let startDateStr;
        try {
          const startDateObj = new Date(start_date);
          if (isNaN(startDateObj.getTime()))
            throw new Error("Invalid start_date");
          const yyyy = startDateObj.getFullYear(); //  ใช้ startDateObj
          const mm = String(startDateObj.getMonth() + 1).padStart(2, "0");
          const dd = String(startDateObj.getDate()).padStart(2, "0");
          startDateStr = `${yyyy}-${mm}-${dd}`; //  เขียนทับตัวแปรด้านนอก
        } catch (err) {
          console.error(" start_date is invalid:", start_date);
          return res.status(500).json({
            status: 0,
            message: "Invalid start_date format from database.",
            booking_id,
          });
        }

        // ✅ ตรวจและจัดการ start_time (รับ HH:mm หรือ HH:mm:ss)
        if (
          !start_time ||
          typeof start_time !== "string" ||
          !/^\d{2}:\d{2}(:\d{2})?$/.test(start_time)
        ) {
          console.error(" Invalid start_time:", start_time);
          return res.status(500).json({
            status: 0,
            message: "Invalid start_time format from database.",
            booking_id,
          });
        }

        const trimmedStartTime = start_time.slice(0, 5); // เหลือแค่ HH:mm

        //  รวมวันเวลา และแปลงเป็นเวลาประเทศไทย
        const startDateTimeRaw = `${startDateStr}T${trimmedStartTime}:00`;
        const startDateTime = new Date(startDateTimeRaw);
        if (isNaN(startDateTime.getTime())) {
          console.error(" Invalid startDateTime:", startDateTimeRaw);
          return res.status(500).json({
            status: 0,
            message: "Cannot parse combined start date/time.",
            booking_id,
          });
        }
        startDateTime.setHours(startDateTime.getHours() + 7); // ปรับเป็นเวลาไทย
        console.log("startDateStr:", startDateStr); // ควรเป็น 2025-06-02
        console.log("start_time:", start_time); // ควรเป็น 19:00:00

        //  ถ้าไม่มีเวลายกเลิก → ยกเลิกได้ทันที
        if (cancel_hours === null) {
          const paymentResult = await pool.query(
            `SELECT deposit_slip, total_slip FROM payment WHERE booking_id = $1`,
            [booking_id]
          );

          if (paymentResult.rowCount > 0) {
            const { deposit_slip, total_slip } = paymentResult.rows[0];

            // ลบ deposit_slip ถ้ามี
            if (deposit_slip) await deleteCloudinaryFile(deposit_slip);
            if (total_slip) await deleteCloudinaryFile(total_slip);

            // ลบ row จาก payment
            await pool.query(`DELETE FROM payment WHERE booking_id = $1`, [
              booking_id,
            ]);
          }
          await pool.query(`DELETE FROM booking_fac WHERE booking_id = $1`, [
            booking_id,
          ]);
          await pool.query(`DELETE FROM bookings WHERE booking_id = $1`, [
            booking_id,
          ]);

          return res.status(200).json({
            status: 1,
            message: `การจองสนาม ${field_name} เวลา ${trimmedStartTime} วันที่ ${startDateStr} ถูกยกเลิกเรียบร้อย`,
            cancelDeadline: null,
            now: now.toISOString(),
          });
        }

        // ✅ คำนวณเส้นตายการยกเลิก
        const cancelDeadline = new Date(
          startDateTime.getTime() - cancel_hours * 60 * 60 * 1000
        );

        console.log("Frontend ส่งมา (cancel_time):", now.toISOString());
        console.log("เวลาเริ่ม:", startDateTime.toISOString());
        console.log("เส้นตายยกเลิก:", cancelDeadline.toISOString());

        // ✅ เปรียบเทียบเวลา
        if (now < cancelDeadline) {
          const paymentResult = await pool.query(
            `SELECT deposit_slip, total_slip FROM payment WHERE booking_id = $1`,
            [booking_id]
          );

          if (paymentResult.rowCount > 0) {
            const { deposit_slip, total_slip } = paymentResult.rows[0];

            if (deposit_slip) await deleteCloudinaryFile(deposit_slip);
            if (total_slip) await deleteCloudinaryFile(total_slip);

            // ลบ row จาก payment
            await pool.query(`DELETE FROM payment WHERE booking_id = $1`, [
              booking_id,
            ]);
          }
          await pool.query(`DELETE FROM booking_fac WHERE booking_id = $1`, [
            booking_id,
          ]);
          await pool.query(`DELETE FROM bookings WHERE booking_id = $1`, [
            booking_id,
          ]);

          if (req.io) {
            req.io.emit("slot_booked", {
              bookingId: booking_id,
            });
          }

          return res.status(200).json({
            status: 1,
            message: `การจองสนาม ${field_name} เวลา ${trimmedStartTime} วันที่ ${startDateStr} ถูกยกเลิกเรียบร้อย`,
            cancelDeadline: cancelDeadline.toISOString(),
            now: now.toISOString(),
          });
        } else {
          return res.status(400).json({
            status: 0,
            message: `ไม่สามารถยกเลิกได้ เลยเวลาการยกเลิกภายใน ${cancel_hours} ชม. ก่อนจะเริ่ม`,
            field: field_name,
            startDateTime: startDateTime.toISOString(),
            cancelDeadline: cancelDeadline.toISOString(),
            now: now.toISOString(),
          });
        }
      } catch (error) {
        console.error(" Error while canceling booking:", error);

        return res.status(500).json({
          status: 0,
          message: "Internal Server Error",
          error: error.message,
          booking_id,
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  router.post(
    "/upload-slip/:booking_id",
    upload.fields([
      { name: "deposit_slip", maxCount: 1 },
      { name: "total_slip", maxCount: 1 },
    ]),
    async (req, res) => {
      const client = await pool.connect();
      try {
        const bookingId = req.params.booking_id;

        let depositSlip =
          req.files["deposit_slip"]?.[0]?.path?.replace(/\\/g, "/") || null;
        let totalSlip =
          req.files["total_slip"]?.[0]?.path?.replace(/\\/g, "/") || null;

        if (!depositSlip && !totalSlip) {
          return res.status(400).json({
            success: false,
            message: "ต้องแนบสลิปอย่างน้อยหนึ่งรายการ",
          });
        }

        // UPSERT → มี booking_id อยู่แล้วให้ update, ไม่มีให้ insert
        const result = await client.query(
          `
        INSERT INTO payment (booking_id, deposit_slip, total_slip)
        VALUES ($1, $2, $3)
        ON CONFLICT (booking_id)
        DO UPDATE SET 
          deposit_slip = COALESCE(EXCLUDED.deposit_slip, payment.deposit_slip),
          total_slip = COALESCE(EXCLUDED.total_slip, payment.total_slip)
        RETURNING *;
        `,
          [bookingId, depositSlip, totalSlip]
        );

        // Emit socket
        if (req.io) req.io.emit("slot_booked", { bookingId });

        res.json({
          success: true,
          message: "Upload success",
          filePath: { depositSlip, totalSlip },
          payment_id: result.rows[0].payment_id,
        });
      } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      } finally {
        client.release();
      }
    }
  );

  router.put(
    "/upload-slip/:booking_id",
    upload.fields([{ name: "total_slip", maxCount: 1 }]),
    async (req, res) => {
      const client = await pool.connect();
      try {
        const bookingId = req.params.booking_id;
        const totalSlip = req.files["total_slip"]?.[0]?.path?.replace(
          /\\/g,
          "/"
        );

        if (!totalSlip) {
          return res
            .status(400)
            .json({ success: false, message: "ต้องแนบสลิป" });
        }

        // ตรวจสอบว่ามี row หรือยัง
        const check = await client.query(
          `SELECT * FROM payment WHERE booking_id = $1`,
          [bookingId]
        );

        let result;
        if (check.rows.length > 0) {
          // มีอยู่แล้ว → update
          result = await client.query(
            `UPDATE payment SET total_slip = $1 WHERE booking_id = $2 RETURNING *`,
            [totalSlip, bookingId]
          );
        } else {
          // ยังไม่มี → insert ใหม่
          result = await client.query(
            `INSERT INTO payment (booking_id, total_slip) VALUES ($1, $2) RETURNING *`,
            [bookingId, totalSlip]
          );
        }

        if (result.rows.length > 0) {
          const data = await client.query(
            `SELECT 
              ub.first_name AS booker_first_name,
              ub.last_name AS booker_last_name,
              ub.email AS booker_email,
              uf.email AS field_owner_email,
              f.field_name, 
              sf.sub_field_name,
              b.booking_date,
              b.start_time,
              b.end_time  
            FROM bookings b 
            LEFT JOIN field f ON b.field_id = f.field_id
            LEFT JOIN sub_field sf ON b.sub_field_id = sf.sub_field_id
            LEFT JOIN users ub ON ub.user_id = b.user_id         -- ผู้จอง
            LEFT JOIN users uf ON uf.user_id = f.user_id         -- เจ้าของสนาม
            WHERE b.booking_id = $1`,
            [bookingId]
          );

          if (data.rows.length === 0) {
            return res
              .status(404)
              .json({ success: false, message: "ไม่พบข้อมูลการจอง" });
          }
          const bookingData = data.rows[0];
          console.log("bookingData:", bookingData);

          if (!bookingData.field_owner_email) {
            console.error("ไม่พบอีเมลเจ้าของสนาม");
          } else {
            try {
              const emailRes = await resend.emails.send({
                from: process.env.Sender_Email,
                to: bookingData.field_owner_email,
                subject: "ตรวจสอบสลิปและอัปเดตสถานะการจองให้เสร็จสิ้น",
                html: ` <div style="font-family: 'Kanit', sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
      <h2 style="color: #1d4ed8; margin-bottom: 16px;">มีการอัปโหลดสลิปใหม่!</h2>

      <p style="font-size: 16px; color: #111827;">
        สำหรับสนาม <strong style="color: #0f172a;">${bookingData.field_name}</strong> ระบบได้รับสลิปใหม่แล้ว
      </p>

      <div style="margin: 20px 0;">
        <a
          href="${process.env.FONT_END_URL}/login?redirect=/bookingDetail/${bookingId}"
          style="display: inline-block; background-color: #1d4ed8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;"
          target="_blank"
        >
          ตรวจสอบการจอง #${bookingId}
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280;">
        กรุณาตรวจสอบและอัปเดตสถานะการจองให้เสร็จสิ้น
      </p>

      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

      <p style="font-size: 12px; color: #9ca3af;">
        หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
      </p>
    </div>`,
              });
              console.log("Email sent:", emailRes);
            } catch (emailErr) {
              console.error("Email send error:", emailErr);
            }
          }
        }

        if (req.io) req.io.emit("slot_booked", { bookingId });

        res.json({
          success: true,
          message: "Upload success",
          filePath: { totalSlip },
          payment_id: result.rows[0].payment_id,
        });
      } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        });
      } finally {
        client.release();
      }
    }
  );

  return router;
};
