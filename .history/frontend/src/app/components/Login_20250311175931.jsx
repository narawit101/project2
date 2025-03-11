"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import "../css/login.css";

export default function Login() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showWelcome, setShowWelcome] = useState(false); // สำหรับการแสดงกล่องยินดีต้อนรับ
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

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user)); // เก็บ user เป็น JSON
        alert("เข้าสู่ระบบสำเร็จ");
        
        // แสดงกล่องยินดีต้อนรับ
        setShowWelcome(true);
        
        // ซ่อนข้อความ "ยินดีต้อนรับ" หลัง 3 วินาที
        setTimeout(() => {
          setShowWelcome(false);
        }, 3000); // 3000 มิลลิวินาที = 3 วินาที
        
        router.push("/"); // เปลี่ยนเส้นทางไปหน้าหลัก
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

      {/* แสดงข้อความยินดีต้อนรับเมื่อเข้าสู่ระบบสำเร็จ */}
      {showWelcome && (
        <div className="welcome-message">
          <p>ยินดีต้อนรับเข้าสู่ระบบ!</p>
        </div>
      )}

      {/* แสดงข้อความแสดงข้อผิดพลาด */}
      {message.text && (
        <div className={`message ${message.type}`}>
          <p>{message.text}</p>
        </div>
      )}
    </div>
  );
}
