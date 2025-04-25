"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "@/app/css/calendarStyles.css"; // นำเข้าคลาสสไตล์สำหรับปฏิทิน

export default function MyCalendar() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [date, setDate] = useState(null); // ตั้งค่าเริ่มต้นเป็น null
  const router = useRouter();
  const [opendays, setOenDays] = useState([]);
  const { subFieldId } = useParams();
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
    const fetchData = async () =>
      await fetch(`${API_URL}/field/open-days/${subFieldId}`, {
        method: "GET",
        headers: { "Content-Type": "application" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console("ไม่พบข้อมูลวันเปิดสนาม");
          } else {
            const mapDaysToNum = data[0].open_days.map(
              (day) => daysNumbers[day]
            );
            setOenDays(mapDaysToNum);
            console.log("สำเร็จ", data);
            console.log("สำเร็จ", mapDaysToNum);
          }
        })
        .catch((error) => {
          console.error("Error tetching opendays", error);
        });
    fetchData();
  }, [subFieldId]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    localStorage.setItem("booking_date", newDate.toDateString());
  };
  const handleDateLocal = () => {
    router.push("/");
  };

  if (!date) return <div>Loading...</div>; // แสดงข้อความ loading ขณะรอการตั้งค่า

  return (
    <div>
      <h2>ปฏิทินของฉัน</h2>
      <Calendar
        onChange={handleDateChange}
        value={date}
        tileDisabled={({ date }) => {
          const day = date.getDay();
          return !opendays.includes(day);
        }}
      />

      <p>วันที่ที่เลือก: {date.toDateString()}</p>
      <button onClick={handleDateLocal}>ยืนยัน</button>
    </div>
  );
}
