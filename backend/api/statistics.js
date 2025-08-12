const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middlewares/auth");

router.get("/:field_id", authMiddleware, async (req, res) => {
  const { field_id } = req.params;
  const { startDate, endDate, status, bookingDate } = req.query;
  const user_id = req.user.user_id;
  const user_role = req.user.role;

  try {
    const fieldQuery = await pool.query(
      `SELECT user_id, field_name, status AS field_status FROM field WHERE field_id = $1`,
      [field_id]
    );

    if (fieldQuery.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Field not found" });
    }

    const field = fieldQuery.rows[0];

    if (user_role !== "admin" && field.user_id !== user_id) {
      return res
        .status(403)
        .json({ success: false, error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูล" });
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
  b.pay_method, b.status, b.activity, b.selected_slots,r.rating,r.comment,

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
LEFT JOIN reviews r  ON b.booking_id = r.booking_id
WHERE b.field_id = $1
    `;

    let values = [field_id];
    let paramIndex = 2;

    if (bookingDate) {
      query += ` AND b.booking_date= $${paramIndex}`;
      values.push(bookingDate);
      paramIndex++;
    } else if (startDate && endDate) {
      query += ` AND b.start_date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      values.push(startDate, endDate);
      paramIndex += 2;
    } else if (startDate) {
      query += ` AND b.start_date >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    } else if (endDate) {
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

    const stats = {
      totalBookings: result.rows.length,
      statusCounts: {
        pending: result.rows.filter((row) => row.status === "pending").length,
        approved: result.rows.filter((row) => row.status === "approved").length,
        rejected: result.rows.filter((row) => row.status === "rejected").length,
      },
      totalRevenue: result.rows
        .filter((row) => row.status === "approved")
        .reduce((sum, row) => sum + parseFloat(row.total_price || 0), 0),
    };

    res.status(200).json({
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

module.exports = router;
