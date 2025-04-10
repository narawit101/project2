"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, use } from "react";
import "@/app/css/login.css";

export default function Login() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  useEffect(() => {
    // ตรวจสอบว่า token มีอยู่หรือไม่ และไม่หมดอายุ
    const token = localStorage.getItem("token");
    const expiresAt = localStorage.getItem("expiresAt");

    // ถ้า token มีอยู่และยังไม่หมดอายุ เปลี่ยนเส้นทางไปหน้า "/"
    if (token && Date.now() < expiresAt) {
      const user = localStorage.getItem("user");
      const userStatus = JSON.parse(user);

      // เช็คสถานะของผู้ใช้
      if (userStatus?.status !== "ตรวจสอบแล้ว") {
        router.push("/verification"); // ถ้ายังไม่ตรวจสอบแล้ว ให้ไปหน้า verification
      } else {
        router.push("/"); // ถ้าสถานะเป็นตรวจสอบแล้ว ให้ไปหน้าแรก
      }
    }
  }, []);

  // เพิ่ม useState สำหรับการจัดการข้อความ
  const [message, setMessage] = useState({ text: "", type: "" });

  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.message || "เกิดข้อผิดพลาด", type: "error" });
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("expiresAt", data.expiresAt);
        const storedUser = JSON.parse(localStorage.getItem("user"));
        console.log("Stored user:", storedUser);

        if (storedUser) {
          const userStatus = storedUser.status;

          if (userStatus === "รอยืนยัน") {
            setMessage({
              text: "กรุณารอยืนยัน e-mail เพื่อเข้าใช้งาน",
              type: "error",
            });
            setTimeout(() => {
              router.push("/verification");
            }, 2000);
          } else {
            router.push("/");
          }
        } else {
          console.error("User data is missing in localStorage");
        }
      } else {
        console.error("Token is missing from response:", data);
        setMessage({
          text: "ไม่สามารถรับ Token ได้ โปรดลองอีกครั้ง",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ", type: "error" });
    }
  };

  return (
    <div className="login-container">
      <h2>เข้าสู่ระบบ</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="identifier">ชื่อผู้ใช้หรืออีเมล:</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">รหัสผ่าน:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Login</button>
      </form>

      {/* แสดงข้อความที่ได้จาก setMessage */}
      {message.text && (
        <div className={`message ${message.type}`}>
          <p>{message.text}</p>
        </div>
      )}
    </div>
  );
}
