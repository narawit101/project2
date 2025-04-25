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
  const { subFieldId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);

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
      router.push("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    if (user.status !== "ตรวจสอบแล้ว") {
      router.push("/verification");
    }
  }, []);

  useEffect(() => {
    const storedDate = localStorage.getItem("booking_date"); // ตรวจสอบว่ามีวันที่เก็บใน localStorage หรือไม่
    if (storedDate) {
      setDate(new Date(storedDate)); // ถ้ามีวันที่เก็บไว้ ให้แสดงวันที่นั้น
    }
  }, []);
  useEffect(() => {
    setDate(new Date());
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
    const token = localStorage.getItem("token");
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
            const mapDaysToNum = data[0].open_days.map(
              (day) => daysNumbers[day]
            );
            setOenDays(mapDaysToNum);
            console.log("ข้อมูลสนาม", data);
            console.log("วันที่เปืดสนาม", mapDaysToNum);
          }
        })
        .catch((error) => {
          router.push("/");
          console.error("Error tetching opendays", error);
        });
    fetchData();
  }, [subFieldId]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    localStorage.setItem("booking_date", newDate.toDateString());
  };

  const formatDateToThai = (date) => {
    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Intl.DateTimeFormat("th-TH", options).format(date);
  };

  const today = new Date();

  const handleDateLocal = () => {
    router.push("/");
  };

  return (
    <div>
      <div className="select-day">
        <p>วันที่เลือก: {formatDateToThai(date)}</p>
      </div>
      <div className="calendar-container">
        <Calendar
          onChange={handleDateChange}
          value={date}
          showNeighboringMonth={false}
          minDate={today}
          tileDisabled={({ date, view }) => {
            const day = date.getDay();
            return view === "month" && !opendays.includes(day);
          }}
        />
      </div>

      <div className="save-btn">
        <button onClick={handleDateLocal}>ยืนยัน</button>
      </div>
    </div>
  );
}
