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

  // Fetch sports categories
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
          console.log("ไม่พบข้อมูลประเภทกีฬา");
        } else {
          // Ensure unique sport categories
          const uniqueSportsCategories = [...new Map(data.map(item => [item.sport_id, item])).values()];
          setSportsCategories(uniqueSportsCategories); // Set categories
        }
      })
      .catch((error) => {
        console.error("Error fetching sports categories:", error);
      });
  }, []);

  // Fetch approved fields based on the selected sport
  useEffect(() => {
    const token = localStorage.getItem("token");
    const queryParams = selectedSport ? `?sport_id=${selectedSport}` : ""; // Add sport_id query if selected

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
  }, [selectedSport]); // Refetch when selectedSport changes

  const convertToThaiDays = (days) => {
    if (!days) return "";

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
            {/* Dropdown to select sport category */}
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="sport-select"
            >
              <option value="">เลือกประเภทกีฬา</option>
              {sportsCategories.map((category) => (
                <option key={category.sport_id} value={category.sport_id}> {/* Ensure unique key */}
                  {category.sport_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid">
            {approvedFields.length > 0 ? (
              approvedFields.map((field) => (
                <div
                  key={field.field_id}
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
