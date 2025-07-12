"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "@/app/css/calendar-styles.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

export default function MyCalendar() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [date, setDate] = useState(null);
  const router = useRouter();
  const [opendays, setOenDays] = useState([]);
  const [fieldData, setFieldData] = useState([]);
  const { subFieldId } = useParams();
  const [isClient, setIsClient] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const { user, isLoading } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad); 

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const storedData = sessionStorage.getItem("booking_date");
    const storedExpiry = sessionStorage.getItem("booking_date_expiry");

    if (storedData && storedExpiry) {
      const expiryDate = new Date(storedExpiry);
      const currentDate = new Date();

      if (currentDate < expiryDate) {
        setDate(new Date(storedData));
      } else {
        sessionStorage.removeItem("booking_date");
        sessionStorage.removeItem("booking_date_expiry");
        setDate(null);
      }
    }
  }, []);

  useEffect(() => {
    setDate(null);
    if (!subFieldId) return;

    const daysNumbers = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("auth_mobile_token");

        const res = await fetch(`${API_URL}/field/open-days/${subFieldId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        const data = await res.json();

        if (data.error) {
          console.error("ไม่พบข้อมูลวันเปิดสนาม");
          setMessage("ไม่พบข้อมูลวันเปิดสนาม");
          setMessageType("error");
          return;
        }

        if (data[0] && data[0].open_days) {
          const mapDaysToNum = data[0].open_days.map((day) => daysNumbers[day]);

          const selectedSubField =
            data[0].sub_fields.find(
              (subField) => subField.sub_field_id === parseInt(subFieldId)
            ) || "ไม่พบข้อมูล";

          setOenDays(mapDaysToNum);
          setFieldData(selectedSubField);

          console.log("ข้อมูลสนาม", data);
          console.log("ข้อมูลสนามย่อย", selectedSubField);
          console.log("วันที่เปิดสนาม", mapDaysToNum);
        } else {
          setMessage("ไม่สามารถดึงข้อมูลวันเปิดสนามได้");
          setMessageType("error");
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการโหลดข้อมูล:", error);
        setMessage("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        setMessageType("error");
        router.replace("/");
      } finally {
        setIsClient(false);
      }
    };

    fetchData();
  }, [subFieldId]);

  const handleDateChange = (newDate) => {
    // ถ้าคลิกวันที่เดิม, รีเซ็ตค่า
    if (date && newDate.toDateString() === date.toDateString()) {
      setDate(null);
      sessionStorage.removeItem("booking_date");
      sessionStorage.removeItem("booking_date_expiry");
    } else {
      setDate(newDate);
      sessionStorage.setItem("booking_date", newDate.toDateString());
      // ตั้งวันหมดอายุหลังจาก 10 นาที
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + 10); // ตั้งวันหมดอายุหลังจาก 10 นาที
      sessionStorage.setItem("booking_date_expiry", expiryDate.toString()); // เก็บวันหมดอายุ
    }
  };

  const formatDateToThai = (date) => {
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Intl.DateTimeFormat("th-TH", options).format(date);
  };
  const formatPrice = (value) => new Intl.NumberFormat("th-TH").format(value);

  const handleDateConfirm = async () => {
    try {
      if (!date) {
        setMessage("กรุณาเลือกวันที่");
        setMessageType("error");
        return;
      }
      SetstartProcessLoad(true);
      await new Promise((resolve) => setTimeout(resolve, 150));

      const storedExpiry = sessionStorage.getItem("booking_date_expiry");
      const expiryDate = new Date(storedExpiry);
      const currentDate = new Date();

      if (currentDate > expiryDate) {
        setMessage("กรุณาเลือกวันที่ใหม่");
        setMessageType("error");
        return;
      }

      const day = date.getDay();
      if (opendays.includes(day)) {
        router.push(`/booking/${subFieldId}`);
      } else {
        setMessage("ไม่สามารถเลือกวันนี้ได้");
        setMessageType("error");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาด:", error);
      setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
      setMessageType("error");
    } finally {
      setTimeout(() => {
        SetstartProcessLoad(false);
      }, 1000);
    }
  };

  const today = new Date();

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);

  const tileClassName = ({ date, view }) => {
    const day = date.getDay();
    if (
      view === "month" &&
      opendays.includes(day) &&
      date <= maxDate &&
      date >= today
    ) {
      return "allowed-day"; // เพิ่มคลาสสำหรับวันที่อนุญาตให้ hover
    }
    return ""; // วันที่ไม่อนุญาตจะไม่มีคลาส
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (isClient)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <div>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}

      <div className="calendar-wrapper" style={{ position: "relative" }}>
        {startProcessLoad && <div className="calendar-overlay" />}
        <Calendar
          onChange={handleDateChange}
          value={date}
          showNeighboringMonth={false}
          minDate={today}
          maxDate={maxDate}
          tileClassName={tileClassName}
          tileDisabled={({ date, view }) => {
            const day = date.getDay();
            return view === "month" && !opendays.includes(day);
          }}
        />
      </div>

      <div className="sub-field-detail-container-calendar">
        {fieldData !== "ไม่พบข้อมูล" ? (
          <div className="forcast-calendar">
            <p className="sub-name">
              <strong>สนาม</strong> {fieldData.sub_field_name}
            </p>
            <p className="price">
              <strong>ราคา/ชม.</strong> {formatPrice(fieldData.price)} บาท
            </p>
            <p className="type">
              <strong>กีฬา</strong> {fieldData.sport_name}
            </p>
            <div className="select-day">
              <p>
                วันที่: {date ? formatDateToThai(date) : "ยังไม่ได้เลือกวันที่"}
              </p>
              <div>**สามารถจองล่วงหน้าได้ไม่เกิน 7 วัน</div>
            </div>
            <div className="save-btn-calendar">
              <button
                onClick={handleDateConfirm}
                style={{
                  cursor: startProcessLoad ? "not-allowed" : "pointer",
                }}
                disabled={startProcessLoad}
              >
                {startProcessLoad ? (
                  <span className="dot-loading">
                    <span className="dot one">●</span>
                    <span className="dot two">●</span>
                    <span className="dot three">●</span>
                  </span>
                ) : (
                  "ยืนยันการเลือกวันที่"
                )}
              </button>
            </div>
          </div>
        ) : (
          <p>{fieldData}</p>
        )}
      </div>
    </div>
  );
}
