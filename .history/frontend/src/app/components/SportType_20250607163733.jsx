"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/HomePage.css";
import { useAuth } from "@/app/contexts/AuthContext";

export default function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState("");
  const [approvedFields, setApprovedFields] = useState([]);
  const [selectedSportName, setSelectedSportName] = useState("");
  const [sportsCategories, setSportsCategories] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user?.status !== "ตรวจสอบแล้ว") {
        router.push("/verification");
      }
    }
  }, [user, isLoading, , router]);

useEffect(() => {
  const fetchSportsCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/sports_types/preview/type`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.error) {
        console.error("เกิดข้อผิดพลาด:", data.error);
      } else {
        setSportsCategories(data);
      }
    } catch (error) {
      console.error("Error fetching sports categories:", error);
    } finally {
      setDataLoading(false); 
    }
  };

  fetchSportsCategories();
}, []);


useEffect(() => {
  const fetchApprovedFields = async () => {
    setDataLoading(true); // เริ่มโหลด

    try {
      const queryParams = selectedSport ? `?sport_id=${selectedSport}` : "";

      const res = await fetch(`${API_URL}/sports_types/preview${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (data.error) {
        console.error("เกิดข้อผิดพลาด:", data.error);
      } else {
        setApprovedFields(data);
      }
    } catch (error) {
      console.error("Error fetching approved fields:", error);
    } finally {
      setDataLoading(false); // จบโหลด
    }
  };

  fetchApprovedFields();
}, [selectedSport]);


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

  const handleSportChange = (e) => {
    setSelectedSport(e.target.value);
    const sport = sportsCategories.find(
      (category) => category.sport_id === e.target.value
    );
    setSelectedSportName(sport ? sport.sport_name : "");
  };

  if (dataLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <>
      <div className="container-home">
        <div className="section-title-container">
          <h2 className="section-title-home">สนามที่แนะนำ</h2>
          <select
            value={selectedSport}
            onChange={handleSportChange}
            className="sport-select-main"
          >
            <option value="">ประเภทกีฬาทั้งหมด</option>
            {sportsCategories.map((category) => (
              <option key={category.sport_id} value={category.sport_id}>
                {category.sport_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid-home">
          {approvedFields.length > 0 ? (
            approvedFields.map((field, index) => (
              <div
                key={`${field.field_id}-${index}`}
                className="card-home"
                onClick={() => router.push(`/profile/${field.field_id}`)}
              >
                <img
                  src={
                    field.img_field
                      ? `${API_URL}/${field.img_field}`
                      : "https://via.placeholder.com/300x200"
                  }
                  alt={field.field_name}
                  className="card-img-home"
                />
                <div className="card-body-home">
                  <h3>{field.field_name}</h3>
                  <div className="firsttime-home">
                    <p className="filedname">
                      <span className="first-label-time">เปิดเวลา: </span>
                      {field.open_hours} น. - {field.close_hours} น.
                    </p>
                  </div>
                  <div className="firstopen-home">
                    <p>
                      <span className="first-label-time">วันทำการ: </span>
                      {convertToThaiDays(field.open_days)}
                    </p>
                  </div>
                  <div className="firstopen-home">
                    <p>
                      <span className="first-label-time">กีฬา: </span>
                      {field.sport_names?.join(" / ")}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div> </div>
          )}

          {approvedFields.length === 0 && (
            <div className="no-fields-message">
              ยังไม่มีสนาม <strong>{selectedSportName}</strong> สำหรับกีฬานี้
            </div>
          )}
        </div>
      </div>
    </>
  );
}
