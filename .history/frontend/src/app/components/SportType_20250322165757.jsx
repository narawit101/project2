"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ Next.js navigation
import "@/app/css/HomePage.css"; // ถ้ามีการใช้งาน CSS เพิ่มเติม

export default function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [approvedFields, setApprovedFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันแปลงวันเป็นภาษาไทย
  const convertToThaiDays = (days) => {
    const dayMapping = {
      Mon: "จันทร์",
      Tue: "อังคาร",
      Wed: "พุธ",
      Thu: "พฤหัสบดี",
      Fri: "ศุกร์",
      Sat: "เสาร์",
      Sun: "อาทิตย์",
    };

    if (Array.isArray(days)) {
      return days.map((day) => dayMapping[day] || day).join(" ");
    }

    return days
      .split(" ")
      .map((day) => dayMapping[day] || day)
      .join(" ");
  };

  // ดึงข้อมูลประเภทกีฬาและสนามที่ผ่านการอนุมัติจาก API
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/sports_types/preview`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.log("ไม่พบข้อมูลสนามกีฬา");
        } else {
          setApprovedFields(data);
        }
      })
      .catch((error) => {
        console.error("Error fetching approved fields:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <div className="section-title-container">
        <h2 className="section-title">สนามที่แนะนำ</h2>
      </div>
      <div className="grid">
        {loading ? (
          <div className="load">
            <span className="spinner"></span> กำลังโหลด...
          </div>
        ) : approvedFields.length > 0 ? (
          approvedFields.map((sport) => (
            <div key={sport.sport_id} style={{ marginBottom: "2rem" }}>
              <h2>{sport.sport_name}</h2>
              <div className="grid">
                {sport.fields.length > 0 ? (
                  sport.fields.map((field) => {
                    // สร้าง key ที่ไม่ซ้ำกัน
                    const fieldKey = `${field.field_id}-${field.sub_field_id || field.field_id}`;
                    return (
                      <div
                        key={fieldKey}  // ใช้ field_id หรือ sub_field_id ถ้ามี
                        className="card"
                        onClick={() => router.push(`/profile/${field.field_id}`)}
                      >
                        <img
                          src={
                            field.img_field
                              ? `${API_URL}/${field.img_field}`
                              : "https://via.placeholder.com/300x200"
                          }
                          alt={field.field_name}
                          className="card-img"
                        />
                        <div className="card-body">
                          <h3>{field.field_name}</h3>
                          <p>
                            <span>เปิดเวลา:</span> {field.open_hours} - {field.close_hours} น.
                          </p>
                          <p>
                            <span>วันทำการ:</span> {convertToThaiDays(field.open_days)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>ยังไม่มีสนามที่ผ่านการอนุมัติในประเภทนี้</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>ไม่พบข้อมูลสนามที่ผ่านการอนุมัติ</p>
        )}
      </div>
    </div>
  );
}
