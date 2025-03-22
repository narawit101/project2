"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ Next.js navigation
import "@/app/css/HomePage.css";

export default function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [approvedFields, setApprovedFields] = useState([]);
  const [sportsCategories, setSportsCategories] = useState([]);
  const [selectedSport, setSelectedSport] = useState("");

  // ดึงข้อมูลประเภทกีฬา
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/sports_types/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.log("ไม่พบข้อมูลประเภทกีฬา");
        } else {
          setSportsCategories(data); // เซตข้อมูลประเภทกีฬา
        }
      })
      .catch((error) => {
        console.error("Error fetching sports categories:", error);
      });
  }, []);

  // ดึงข้อมูลสนามที่ผ่านการอนุมัติ
  useEffect(() => {
    const token = localStorage.getItem("token");
    const queryParams = selectedSport ? `?sport_id=${selectedSport}` : ""; // เพิ่ม sport_id ใน query หากเลือกแล้ว

    fetch(`${API_URL}/sports_types/preview${queryParams}`, {
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
      });
  }, [selectedSport]); // เรียกใช้ใหม่เมื่อ selectedSport เปลี่ยน

  const convertToThaiDays = (days) => {
    if (!days) return ""; // ถ้า days เป็น undefined หรือ null ให้คืนค่าเป็นสตริงว่าง

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

  return (
    <>
      <div className="homepage">
        <div className="container">
          <div className="section-title-container">
            <h2 className="section-title">สนามที่แนะนำ</h2>
            {/* Dropdown เพื่อเลือกประเภทกีฬา */}
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="sport-select"
            >
              <option value="">เลือกประเภทกีฬา</option>
              {sportsCategories.map((category) => (
                <option key={category.sport_id} value={category.sport_id}> {/* ใส่ key สำหรับแต่ละ option */}
                  {category.sport_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid">
            {approvedFields.length > 0 ? (
              approvedFields.map((field) => (
                <div
                  key={field.field_id}  // ใช้ key เป็น field_id สำหรับแต่ละการ์ด
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
                    <div className="firstname">
                      <p className="filedname">
                        <span className="first-label-time">เปิดเวลา:</span>
                        {field.open_hours} น. - {field.close_hours} น.
                      </p>
                    </div>
                    <div className="firstopen">
                      <p>
                        <span className="first-label-date">วันทำการ:</span>
                        {convertToThaiDays(field.open_days)}
                      </p>
                      <p>
                        <span className="first-label-date">ประเภทกีฬา:</span>
                        {field.sport_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="load">
                <span className="spinner"></span> กำลังโหลด...
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
