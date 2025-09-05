"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import "@/app/css/search-field.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar as solidStar,
  faStarHalfAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as regularStar } from "@fortawesome/free-regular-svg-icons";
export default function Search() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const [approvedFields, setApprovedFields] = useState([]);
  const [message, setMessage] = useState(""); 
  const [messageType, setMessageType] = useState(""); 
  const [dataLoading, setDataLoading] = useState(true);
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const fieldPerPage = 16;

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user?.status !== "ตรวจสอบแล้ว") {
        router.push("/verification");
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!query) {
      setApprovedFields([]);
      setDataLoading(false);
      return;
    }

    const dayMapThaiToEng = {
      จันทร์: "Mon",
      อังคาร: "Tue",
      พุธ: "Wed",
      พฤหัสบดี: "Thu",
      ศุกร์: "Fri",
      เสาร์: "Sat",
      อาทิตย์: "Sun",
    };

    const translatedQuery = dayMapThaiToEng[query?.trim()] || query;

    const fetchApprovedFields = async () => {
      setDataLoading(true);
      try {
        console.log("query", query);
        console.log("query days", translatedQuery);
        const res = await fetch(
          `${API_URL}/search?query=${encodeURIComponent(translatedQuery)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await res.json();

        if (res.ok) {
          setApprovedFields(data.data);
          console.log("approvefield", data);
        } else {
          console.error("เกิดข้อผิดพลาด:", data.error);
          setMessage(data.error);
          setMessageType("error");
        }
      } catch (error) {
        console.error("Error fetching approved fields:", error);
        setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchApprovedFields();
  }, [query]);

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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2000);

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

      <div className="container-search">
        <div className="topbar-serach">
          {approvedFields.length > 0 && !dataLoading && (
            <div className="find-fields-message-search">
              พบทั้งหมด {approvedFields.length} รายการสำหรับ
              <p> "{query || ""}"</p>
            </div>
          )}
        </div>
        {dataLoading ? (
          <div className="grid-search">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="skeleton-field-search">
                <div className="skeleton-field-img-search"></div>
                <div className="skeleton-header-search">
                  <div className="skeleton-lines-search">
                    <div className="skeleton-line-search w90-search"></div>
                    <div className="skeleton-line-search w70-search"></div>
                  </div>
                </div>
                <div className="skeleton-lines-search">
                  <div className="skeleton-line-search w80-search"></div>
                  <div className="skeleton-line-search w60-search"></div>
                  <div className="skeleton-line-search w50-search"></div>
                </div>
              </div>
            ))}
          </div>
        ) : currentField.length > 0 ? (
          <div className="grid-search">
            {currentField.map((field, index) => (
              <div
                key={`${field.field_id}-${index}`}
                className="card-search"
                onClick={() => router.push(`/profile/${field.field_id}`)}
              >
                <img
                  src={
                    field.img_field
                      ? `${field.img_field}`
                      : "https://www.nstru.ac.th/resources/news/thumbnail/221.jpg"
                  }
                  alt={field.field_name}
                  className="card-img-search"
                />
                <div className="card-body-search">
                  <h3>{field.field_name}</h3>
                  <div className="reviwe-container-search">
                    <strong className="reviwe-star-search">
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

                  <div className="firsttime-search">
                    <p className="filedname">
                      <span className="first-label-time">เปิดเวลา: </span>
                      {field.open_hours} น. - {field.close_hours} น.
                    </p>
                  </div>
                  <div className="firstopen-search">
                    <p>
                      <span className="first-label-time">วันทำการ: </span>
                      {convertToThaiDays(field.open_days)}
                    </p>
                  </div>
                  <div className="firstopen-search">
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
          <div className="no-results-container-search">
            <div className="no-results-icon-search">🔍</div>
            <div className="no-results-message-search">
              <h3>ไม่พบผลการค้นหา</h3>
              <p>
                ไม่พบสนามกีฬาที่ตรงกับ <span className="query-highlight-search">"{query}"</span>
              </p>
              <div className="search-suggestions-search">
                <p>ลองค้นหาด้วยคำอื่น เช่น:</p>
                <ul>
                  <li>ชื่อสนามกีฬา</li>
                  <li>ประเภทกีฬา (ฟุตบอล, บาสเกตบอล)</li>
                  <li>วันที่เปิดให้บริการ (จันทร์, อังคาร)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="pagination-previwe-field-search">
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
