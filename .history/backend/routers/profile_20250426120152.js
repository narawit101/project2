const express = require("express");
const router = express.Router();
const pool = require("../db");
// const authMiddleware = require("../middlewares/auth");

router.get("/:field_id", async (req, res) => {
  try {
    const { field_id } = req.params;

    const result = await pool.query(
      `SELECT 
            f.field_id, f.field_name, f.address, f.gps_location, f.documents,
            f.open_hours, f.close_hours, f.img_field, f.name_bank, 
            f.number_bank, f.account_holder, f.status, f.price_deposit, 
            f.open_days, f.field_description,
            u.user_id, u.first_name, u.last_name, u.email,
            COALESCE(json_agg(
              jsonb_build_object(
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
            ), '[]'::json) AS sub_fields
          FROM field f
          INNER JOIN users u ON f.user_id = u.user_id
          LEFT JOIN sub_field s ON f.field_id = s.field_id
          LEFT JOIN sports_types sp ON s.sport_id = sp.sport_id
          WHERE f.field_id = $1
          GROUP BY f.field_id, u.user_id,s.sub_field_id
          ORDER BY s.sub_field_id ASC;`,  // เรียงตาม sub_field_id
      [field_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลสนามกีฬา" });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลสนามกีฬา" });
  }
});


module.exports = router;
