"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/changePassword.css";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("รหัสใหม่และการยืนยันรหัสไม่ตรงกัน");
      setMessageType("error");
      return;
    }

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      setMessage("กรุณาล็อกอินก่อน");
      setMessageType("error");
      router.push("/login"); // เปลี่ยนเส้นทางไปที่หน้า Login
      return;
    }

    const user = JSON.parse(storedUser);
   
    useEffect(()=>{
      if(user.status !== "ตรวจสอแล้ว"){
        router.push("/verification")
      }
    },[router])

    if (!user.user_id) {
      setMessage("ข้อมูลผู้ใช้ไม่สมบูรณ์");
      setMessageType("error");
      return;
    }
    const token = localStorage.getItem("token");
    // เรียก API เพื่อตรวจสอบรหัสเดิม
    try {
      const response = await fetch(
        `${API_URL}/users/${user.user_id}/check-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const updateResponse = await fetch(
          `${API_URL}/users/${user.user_id}/change-password`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              password: newPassword,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role: user.role,
            }),
          }
        );

        if (updateResponse.ok) {
          setMessage("รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว");
          setMessageType("success");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } else {
          setMessage("เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน");
          setMessageType("error");
        }
      } else {
        setMessage("รหัสเดิมไม่ถูกต้อง");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("เกิดข้อผิดพลาดในการตรวจสอบรหัสเดิม");
      setMessageType("error");
    }
  };
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="change-password-container">
        <h2>เปลี่ยนรหัสผ่าน</h2>
        <form onSubmit={handlePasswordChange}>
          <label>รหัสเดิม:</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <label>รหัสใหม่:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <label>ยืนยันรหัสใหม่:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="save-btn">
            บันทึก
          </button>
        </form>
      </div>
    </div>
  );
}
