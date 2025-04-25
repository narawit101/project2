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
  const [field, setfield] = useState([]);
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
            setfield(data);
            console.log("ข้อมูลสนาม", data);
            const mapDaysToNum = data[0].open_days.map(
              (day) => daysNumbers[day]
            );
            setOenDays(mapDaysToNum);
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

  // ฟังก์ชันตรวจสอบว่าค่า date ที่เลือกเป็นวันเปิดหรือไม่
  const handleDateConfirm = () => {
    if (date) {
      const day = date.getDay();
      if (opendays.includes(day)) {
        router.push("/");
      } else {
        setMessage("ไม่สามารถเลือกวันหยุดนี้ได้");
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

  if (!isClient) return <div>Loading...</div>;
  return (
    <div>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="subfield-name">
      {fieldData?.sub_fields && fieldData.sub_fields.length > 0 ? (
              fieldData.sub_fields.map((sub) => (
                <div key={sub.sub_field_id} className="sub-field-card" onClick={()=> router.push(`/calendar/${sub.sub_field_id}`)}>
                  <p>
                    <strong>ชื่อสนาม:</strong> {sub.sub_field_name}
                  </p>
                  <p>
                    <strong>ราคา:</strong> {sub.price} บาท
                  </p>
                  <p>
                    <strong>กีฬา:</strong> {sub.sport_name}
                  </p>

                  {/*  แสดง Add-ons ถ้ามี */}
                  {sub.add_ons && sub.add_ons.length > 0 ? (
                    <div className="add-ons-container">
                      <h3>ราคาสำหรับจัดกิจกรรมพิเศษ</h3>
                      {sub.add_ons.map((addon) => (
                        <p key={addon.add_on_id}>
                          {addon.content} - {addon.price} บาท
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p>ไม่มีราคาสำหรับกิจกรรมพิเศษ</p>
                  )}
                </div>
              ))
            ) : (
              <p>ไม่มีสนามย่อย</p>
            )}
        </div>
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
        <button onClick={handleDateConfirm}>ยืนยัน</button>
      </div>
    </div>
  );
}
