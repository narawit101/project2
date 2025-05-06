"use client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, use } from "react";
import "@/app/css/login.css";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Login() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, setUser, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
    } else {
      router.push("/");
    }
  }, [user, isLoading]);

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

      const res = await fetch(`${API_URL}/users/me`, {
        credentials: "include",
      });
      if (res.ok) {
        if (isLoading) return;
        const userData = await res.json();
        setUser(userData);
        console.log(userData);
      }

      // if (userData?.status !== "ตรวจสอบแล้ว") {
      //   router.push("/verification");
      // } else {
      //   router.push("/");
      // }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ", type: "error" });
    }
  };

  return (
    <div className="login-container">
      <h2>เข้าสู่ระบบ</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group-login">
          <label htmlFor="identifier">ชื่อผู้ใช้หรืออีเมล:</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
          />
        </div>
        <div className="input-group-login">
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
          <a href="/resetPassword" className="reset-link">
            ลืมรหัสผ่าน
          </a>
          <a href="/register" className="register-link">
            ลงทะเบียน
          </a>
        </div>
      </form>

      {/* แสดงข้อความที่ได้จาก setMessage */}
      {message.text && (
        <div className={`message-p ${message.type}`}>
          <div className="p">{message.text}</div>
        </div>
      )}
    </div>
  );
}
