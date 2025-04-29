"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, use } from "react";
import "@/app/css/login.css";

export default function Login() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const {user} = useAuth();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  useEffect(() => {
    const expiresAt = localStorage.getItem("expiresAt");

    if (Date.now() < expiresAt) {
      const user = localStorage.getItem("user");
      const userStatus = JSON.parse(user);
      if (userStatus?.status !== "ตรวจสอบแล้ว") {
        router.push("/verification"); 
      } else {
        router.push("/");
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
        if (user.status !== "ตรวจสอบแล้ว") {
          setTimeout(() => {
            router.push("/verification");
          }, 500);
        } else {
          window.location.reload()
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
        <div className="reset-password">
        <a href="/resetPassword">ลืมรหัสผ่าน</a>
      </div>
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
