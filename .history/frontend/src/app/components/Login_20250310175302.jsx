"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import "../css/login.css"; // เปลี่ยนให้เรียกใช้ไฟล์ CSS

export default function Login() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [message, setMessage] = useState(""); 
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });
  
      const data = await response.json();
      console.log("Login response data:", data); // ตรวจสอบค่าที่ได้จาก API
  
      if (!response.ok) {
        setMessage({ text: data.message || "เกิดข้อผิดพลาด", type: "error" });
        return;
      }
  
      // ✅ บันทึก token และ user ลง localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user)); // เก็บ user เป็น JSON
        setMessage({ text: `ยินดีต้อนรับ, ${data.user.first_name}`, type: "success" });
        setTimeout(() => router.push("/"), 2000); // รอ 2 วินาทีแล้วเปลี่ยนหน้า
      } else {
        console.error("Token is missing from response:", data);
        setMessage({ text: "ไม่สามารถรับ Token ได้ โปรดลองอีกครั้ง", type: "error" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ", type: "error" });
    }
  };

  return (
    <div className="login-container">
      <h2>เข้าสู่ระบบ</h2>

      {/* แสดงข้อความแจ้งเตือน */}
      {message && (
        <div className={`message ${message.type}`}>
          <i className={`fas fa-${message.type === 'error' ? 'times-circle' : 'check-circle'}`}></i>
          {message.text}
        </div>
      )}

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
    </div>
  );
}
