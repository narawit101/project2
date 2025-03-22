"use client";
import React, { useEffect, useState } from "react";

export default function SportType() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/sports_types/preview`)
      .then((res) => {
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        return res.json();
      })
      .then((json) => {
        setData(json);
      })
      .catch((err) => {
        console.error("เกิดข้อผิดพลาด:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [API_URL]);

  return (
    <div className="sport-type-page" style={{ padding: "1rem" }}>
      <h1>ประเภทกีฬาและสนามที่ผ่านการอนุมัติ</h1>

      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : data.length === 0 ? (
        <p>ไม่พบข้อมูล</p>
      ) : (
        data.map((sport) => (
          <div key={sport.sport_id} style={{ marginBottom: "2rem" }}>
            <h2>{sport.sport_name}</h2>

            {sport.fields.length > 0 ? (
              <ul style={{ paddingLeft: "1rem" }}>
                {sport.fields.map((field) => (
                  <li key={field.field_id}>
                    <p><strong>{field.field_name}</strong></p>
                    <img src={field.img_field} alt={field.field_name} style={{ width: "200px", height: "auto", borderRadius: "8px" }} />
                    <p>เวลาเปิด: {field.open_hours} - {field.close_hours}</p>
                    <p>เปิดทำการ: {field.open_days}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>ยังไม่มีสนามที่ผ่านการอนุมัติ</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
