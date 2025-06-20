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

      // (Optional) ส่ง event
      if (req.io && bookingResult.rows.length > 0) {
        req.io.emit("slot_booked", {
          bookingId: bookingResult.rows[0].booking_id,
        });
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({
        success: false,
        error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    }
  });