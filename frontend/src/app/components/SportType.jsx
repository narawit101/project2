"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/home-page.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar as solidStar,
  faStarHalfAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as regularStar } from "@fortawesome/free-regular-svg-icons";

export default function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState("");
  const [approvedFields, setApprovedFields] = useState([]);
  const [selectedSportName, setSelectedSportName] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [sportsCategories, setSportsCategories] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const fieldPerPage = 16;
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

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
      setDataLoading(true);
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
          setMessage(data.error);
          setMessageType("error");
        } else {
          setSportsCategories(data);
        }
      } catch (error) {
        console.error("Error fetching sports categories:", error);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchSportsCategories();
  }, []);

  useEffect(() => {
    const fetchApprovedFields = async () => {
      setDataLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedSport) queryParams.append("sport_id", selectedSport);
        if (date) queryParams.append("date", date);
        if (time) queryParams.append("time", time);

        const queryString = queryParams.toString();
        const res = await fetch(
          `${API_URL}/sports_types/preview${
            queryString ? "?" + queryString : ""
          }`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const contentType = res.headers.get("content-type");
        if (!res.ok || !contentType.includes("application/json")) {
          const text = await res.text();
          console.error("Response is not JSON:", text);
          setMessage("เกิดข้อผิดพลาดจากฝั่งเซิร์ฟเวอร์");
          setMessageType("error");
          return;
        }

        const data = await res.json();

        if (data.error) {
          console.error("เกิดข้อผิดพลาด:", data.error);
          setMessage(data.error);
          setMessageType("error");
        } else {
          setApprovedFields(data);
          console.log("approvefield", data);
        }
      } catch (error) {
        console.error("Error fetching approved fields:", error);
        setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchApprovedFields();
  }, [selectedSport, date, time]);

  const indexOfLast = currentPage * fieldPerPage;
  const indexOfFirst = indexOfLast - fieldPerPage;
  const currentField = approvedFields.slice(indexOfFirst, indexOfLast);

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
    setSelectedSportName(sport ? sport?.sport_name : "");
  };
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="container-home">
        <div className="section-title-container">
          <h2 className="section-title-home">สนามที่แนะนำ</h2>
          <div className="parent-select-home">
            <div className="title-center-home">
              <h2>ค้นหาเวลาว่าง</h2>
            </div>
            <div className="filter-center-home">
              <div className="filter-date-home">
                <label>
                  <input
                    type="date"
                    name="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
              </div>
              <label>
                <select
                  className="select-time-home"
                  name="open_hours"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                >
                  <option value="">-- เลือกเวลา --</option>
                  {Array.from({ length: 48 }, (_, i) => {
                    const hours = String(Math.floor(i / 2)).padStart(2, "0");
                    const minutes = i % 2 === 0 ? "00" : "30";
                    const timeValue = `${hours}:${minutes}`;
                    return (
                      <option key={timeValue} value={timeValue}>
                        {timeValue}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>
          </div>

          <select
            value={selectedSport}
            onChange={handleSportChange}
            className="sport-select-main"
          >
            <option value="">สนามกีฬาทั้งหมด</option>
            {sportsCategories.map((category) => (
              <option key={category.sport_id} value={category.sport_id}>
                {category.sport_name}
              </option>
            ))}
          </select>
        </div>
        {dataLoading ? (
          <div className="loading-data">
            <div className="loading-data-spinner"></div>
          </div>
        ) : currentField.length > 0 ? (
          <div className="grid-home">
            {currentField.map((field, index) => (
              <div
                key={`${field.field_id}-${index}`}
                className="card-home"
                onClick={() => router.push(`/profile/${field.field_id}`)}
              >
                <img
                  src={
                    field.img_field
                      ? `${field.img_field}`
                      : "https://www.nstru.ac.th/resources/news/thumbnail/221.jpg"
                  }
                  alt={field.field_name}
                  className="card-img-home"
                />
                <div className="card-body-home">
                  <h3>{field.field_name}</h3>
                  <div className="reviwe-container-home">
                    <strong className="reviwe-star-home">
                      <p>
                        {field.avg_rating && field.avg_rating > 0
                          ? `คะแนนรีวิว ${field.avg_rating}`
                          : "ยังไม่มีคะแนนรีวิว"}
                      </p>

                      {[1, 2, 3, 4, 5].map((num) => {
                        const rating = field.avg_rating || 0;
                        const roundedRating =
                          Math.floor(rating) + (rating % 1 >= 0.8 ? 1 : 0);

                        const isFull = num <= roundedRating;
                        const isHalf =
                          !isFull && num - 0.5 <= rating && rating % 1 < 0.8;

                        return (
                          <FontAwesomeIcon
                            key={num}
                            icon={
                              isFull
                                ? solidStar
                                : isHalf
                                ? faStarHalfAlt
                                : regularStar
                            }
                            style={{
                              color: "#facc15",
                              fontSize: "20px",
                              marginRight: "4px",
                            }}
                          />
                        );
                      })}
                    </strong>
                  </div>

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
            ))}
          </div>
        ) : (
          <div className="no-fields-message">
            ยังไม่มีสนาม <strong>{selectedSportName}</strong>
          </div>
        )}
      </div>
      <div className="pagination-previwe-field-home">
        {Array.from(
          { length: Math.ceil(approvedFields.length / fieldPerPage) },
          (_, i) => (
            <button
              key={i}
              className={currentPage === i + 1 ? "active" : ""}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          )
        )}
      </div>
    </>
  );
}
