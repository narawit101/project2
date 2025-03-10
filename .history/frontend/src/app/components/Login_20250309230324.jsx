"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

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
        credentials: "include", // ใช้ credentials เพื่อรับ cookie (ถ้าจำเป็น)
      });
  
      const data = await response.json();
      console.log("Login response data:", data); // เช็คค่าที่ได้จาก API
  
      if (!response.ok) {
        setMessage(data.message || "เกิดข้อผิดพลาด");
        return;
      }
  
      // ตรวจสอบว่ามี token หรือไม่
      if (data.token) {
        localStorage.setItem("token", data.token); // ✅ บันทึก token ลง localStorage
        setMessage(`ยินดีต้อนรับ, ${data.user.first_name}`);
        router.push("/");
      } else {
        console.error("Token is missing from response:", data);
        setMessage("ไม่สามารถรับ Token ได้ โปรดลองอีกครั้ง");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ");
    }
  };
  
  

  return (
    <div>
      <h2>เข้าสู่ระบบ</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="identifier">ชื่อผู้ใช้หรืออีเมล:</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
          />
        </div>
        <div>
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
