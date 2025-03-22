"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // ใช้ Next.js navigation
import "@/app/css/HomePage.css";

export default function HomePage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  const [approvedFields, setApprovedFields] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token"); // ดึง token จาก localStorage

    fetch(`${API_URL}/field/allow/preview`, {
      method: "GET", // ใช้ method GET ในการดึงข้อมูล
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ส่ง token ใน Authorization header
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setMessage("ไม่พบข้อมูลสนามกีฬา");
          setMessageType("error");
        } else {
          console.log("ข้อมูลสนามกีฬา (ผ่านการอนุมัติ):", data); // ตรวจสอบข้อมูลที่ได้จาก Backend
          setApprovedFields(data); // ตั้งค่าข้อมูลสนามที่ได้รับการอนุมัติ
        }
      })
      .catch((error) => {
        console.error("Error fetching approved fields:", error);
        setMessage("เกิดข้อผิดพลาดในการดึงข้อมูล");
        setMessageType("error");
      });
  }, []);

  return (
    <>
      <div className="banner-container">
        <video autoPlay loop muted playsInline className="banner-video">
          <source src="/video/bannervideo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="banner-text">
          <h1>Online Sports Venue Booking Platform</h1>
          <h2>แพลตฟอร์มจองสนามกีฬาออนไลน์</h2>
          <div className="btn">
            <button onClick={() => router.push("/")}>จองเลย</button>
          </div>
        </div>
      </div>

      <div className="homepage">
        <h2 className="title-notice">ข่าวสาร</h2>
        <div className="banner-images">
          {/* Carousel for images */}
        </div>

        <div className="container">
          <div className="section-title-container">
            <h2 className="section-title">สนามที่ได้รับการอนุมัติ</h2>
          </div>
          {message && (
            <div className={`message ${messageType}`}>
              <p>{message}</p>
            </div>
          )}
          <div className="grid">
            {approvedFields.length > 0 ? (
              approvedFields.map((field) => (
                <div key={field.field_id} className="card" onClick={() => router.push(`/field/${field.field_id}`)}>
                  <img
                    src={field.img_field || "https://via.placeholder.com/300x200"} // Fallback image
                    alt={field.field_name}
                    className="card-img"
                  />
                  <div className="card-body">
                    <h3>{field.field_name}</h3>
                    <p>เปิดเวลา: {field.open_hours} - ปิดเวลา: {field.close_hours}</p>
                    <p>วันเปิด: {field.open_days}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>ไม่มีสนามที่ได้รับการอนุมัติในขณะนี้</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
