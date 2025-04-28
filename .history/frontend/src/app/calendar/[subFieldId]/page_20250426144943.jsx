"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "@/app/css/calendarStyles.css";

export default function MyCalendar() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [date, setDate] = useState(null); // ตั้งค่าเริ่มต้นเป็น null
  const router = useRouter();
  const [opendays, setOenDays] = useState([]);
  const [fieldData, setFieldData] = useState([]);
  const { subFieldId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const expiresAt = localStorage.getItem("expiresAt");

    if (
      !token ||
      !storedUser ||
      !expiresAt ||
      Date.now() > parseInt(expiresAt)
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("expiresAt");
      setTimeout(() => {
        router.push("/login");
      }, 1500);

      return;
    }

    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    if (user.status !== "ตรวจสอบแล้ว") {
      router.push("/verification");
    }
  }, []);

  useEffect(() => {
    const storedData = localStorage.getItem("booking_date");
    const storedExpiry = localStorage.getItem("booking_date_expiry");

    if (storedData && storedExpiry) {
      const expiryDate = new Date(storedExpiry);
      const currentDate = new Date();

      // ถ้าวันหมดอายุยังไม่ถึงให้แสดงข้อมูล
      if (currentDate < expiryDate) {
        setDate(new Date(storedData));
      } else {
        // ถ้าวันหมดอายุผ่านไปแล้ว ลบข้อมูลใน `localStorage`
        localStorage.removeItem("booking_date");
        localStorage.removeItem("booking_date_expiry");
        setDate(null); // รีเซ็ตค่า
        setMessage("ข้อมูลหมดอายุแล้ว กรุณาเลือกวันที่ใหม่");
        setMessageType("error");
      }
    }
  }, []);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    localStorage.setItem("booking_date", newDate.toDateString());
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 10); // ตั้งวันหมดอายุหลังจาก 10 นาที
    localStorage.setItem("booking_date_expiry", expiryDate.toString()); // เก็บเวลาหมดอายุ
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!subFieldId) {
      return;
    }
    const daysNumbers = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    // เซ็ตวันที่ใน client-side หลังจากโหลด

    const fetchData = async () =>
      await fetch(`${API_URL}/field/open-days/${subFieldId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.log("ไม่พบข้อมูลวันเปิดสนาม");
          } else {
            if (data[0] && data[0].open_days) {
              const mapDaysToNum = data[0].open_days.map(
                (day) => daysNumbers[day]
              );
              const selectedSubField =
                data[0].sub_fields.find(
                  (subField) => subField.sub_field_id === parseInt(subFieldId)
                ) || "ไม่พบข้อมูล";

              setOenDays(mapDaysToNum);
              setFieldData(selectedSubField);
              console.log("ข้อมูลสนาม", data);
              console.log("ข้อมูลสนามย่อย", selectedSubField);
              console.log("วันที่เปืดสนาม", mapDaysToNum);
            } else {
              setMessage("กรุณาล็อกอินก่อน");
              setMessageType("error");
            }
          }
        })
        .catch((error) => {
          router.push("/");
          console.error("Error tetching opendays", error);
        });
    fetchData();
  }, [subFieldId]);

  const formatDateToThai = (date) => {
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Intl.DateTimeFormat("th-TH", options).format(date);
  };

  const handleDateConfirm = () => {
    if(!date)
    // ตรวจสอบว่ามีวันที่เลือกหรือไม่
    if (date) {
      const storedExpiry = localStorage.getItem("booking_date_expiry");
      const expiryDate = new Date(storedExpiry);
      const currentDate = new Date();

      // ตรวจสอบวันหมดอายุ
      if (currentDate > expiryDate) {
        setMessage("กรุณาเลือกวันที่ใหม่");
        setMessageType("error");
        return;
      }

      // ตรวจสอบว่าเป็นวันเปิดหรือไม่
      const day = date.getDay();
      if (opendays.includes(day)) {
        // หากเป็นวันเปิดให้ทำการยืนยัน
        router.push("/"); // หรือไปที่หน้าอื่น
      } else {
        setMessage("ไม่สามารถเลือกวันนี้ได้");
        setMessageType("error");
      }
    }
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

  if (!isClient) return <div>Loading...</div>;
  return (
    <div>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}

      <div className="sub-field-detail-container">
        {fieldData !== "ไม่พบข้อมูล" ? (
          <div>
            <p className="sub-name">
              <strong>สนาม</strong> {fieldData.sub_field_name}
            </p>
            <p className="price">
              <strong>ราคา/ชม.</strong> {fieldData.price} บาท
            </p>
            <p className="type">
              <strong>กีฬา</strong> {fieldData.sport_name}
            </p>
          </div>
        ) : (
          <p>{fieldData}</p>
        )}
      </div>
      <div className="select-day">
      <p>เลือกวันที่: {date ? formatDateToThai(date) : "ยังไม่ได้เลือกวันที่"}</p>
        <div>**สามารถจองล่วงหน้าได้ไม่เกิน 7 วัน</div>
      </div>
      <div className="calendar-container">
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

      <div className="save-btn">
        <button onClick={handleDateConfirm}>เลือกวันที่</button>
      </div>
    </div>
  );
}
