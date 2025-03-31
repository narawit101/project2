"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ Next.js navigation
import "@/app/css/HomePage.css";
import { groupBy } from "lodash";

export default function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState("");
  const [approvedFields, setApprovedFields] = useState([]);
  const [selectedSportName, setSelectedSportName] = useState("");
  const [sportsCategories, setSportsCategories] = useState([]);

  // ดึงข้อมูลประเภทกีฬา
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/sports_types/preview/type`, {
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

  const handleSportChange = (e) => {
    setSelectedSport(e.target.value);
    const sport = sportsCategories.find(
      (category) => category.sport_id === e.target.value
    );
    setSelectedSportName(sport ? sport.sport_name : "");
  };
  const groupedFields = groupBy(approvedFields, "sport_name");
  return (
    <>
       <div className="container">
    {Object.keys(groupedFields).map((sportName) => (
      <div key={sportName}>
        <h3>{sportName}</h3> {/* แสดงชื่อประเภทกีฬา */}
        <div className="grid">
          {groupedFields[sportName].map((field) => (
            <div key={field.field_id} className="card">
              <img
                src={field.img_field ? `${API_URL}/${field.img_field}` : "https://via.placeholder.com/300x200"}
                alt={field.field_name}
                className="card-img"
              />
              <div className="card-body">
                <h3>{field.field_name}</h3>
                <p><strong>เปิดเวลา:</strong> {field.open_hours} น. - {field.close_hours} น.</p>
                <p><strong>วันทำการ:</strong> {convertToThaiDays(field.open_days)}</p>
                <p><strong>ประเภทกีฬา:</strong> {field.sport_name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
    </>
  );
}
