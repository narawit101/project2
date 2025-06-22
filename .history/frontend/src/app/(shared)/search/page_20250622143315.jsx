"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import "@/app/css/Search.css";
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
  const [message, setMessage] = useState(""); // State for messages
  const [messageType, setMessageType] = useState(""); // State for message type (error, success)
  const [dataLoading, setDataLoading] = useState(true);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (user?.status !== "ตรวจสอบแล้ว") {
        router.push("/verification");
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchApprovedFields = async () => {
      try {
        console.log("query", query);
        const res = await fetch(
          `${API_URL}/search?query=${encodeURIComponent(query)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await res.json();

        if (data.error) {
          console.error("เกิดข้อผิดพลาด:", data.error);
          setMessage(data.error);
          setMessageType("error");
        } else {
          setApprovedFields(data.data);
          console.log("approvefield", data);
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
      }, 3500);

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
              พบทั้งหมด {approvedFields.length} รายการ{" "}
              <p> "" {query || ""} ""</p>
            </div>
          )}
        </div>
        {dataLoading ? (
          <div className="loading-data">
            <div className="loading-data-spinner"></div>
          </div>
        ) : approvedFields.length > 0 ? (
          <div className="grid-search">
            {approvedFields.map((field, index) => (
              <div
                key={`${field.field_id}-${index}`}
                className="card-search"
                onClick={() => router.push(`/profile/${field.field_id}`)}
              >
                <img
                  src={
                    field.img_field
                      ? `${field.img_field}`
                      : "https://via.placeholder.com/300x200"
                  }
                  alt={field.field_name}
                  className="card-img-search"
                />
                <div className="card-body-search">
                  <h3>{field.field_name}</h3>
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
                  <div className="reviwe-container-search">
                    <strong className="reviwe-star-search">
                      <p>คะแนนรีวิว {field.avg_rating}</p>
                      {[1, 2, 3, 4, 5].map((num) => {
                        const roundedRating =
                          Math.floor(field.avg_rating) +
                          (field.avg_rating % 1 >= 0.8 ? 1 : 0);

                        const isFull = num <= roundedRating;
                        const isHalf =
                          !isFull &&
                          num - 0.5 <= field.avg_rating &&
                          field.avg_rating % 1 < 0.8;

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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-fields-message-search">
            ยังไม่มีสนามสำหรับ "<p>{query}</p>"
          </div>
        )}
      </div>
    </>
  );
}
