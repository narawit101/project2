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

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setMessage("กรุณาล็อกอินก่อน");
      setMessageType("error");
      router.push("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    if (user.status !== "ตรวจสอบแล้ว") {
      router.push("/verification");
    }
  }, [router]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword.length < 10) {
      setMessage("รหัสผ่านใหม่ต้องขั้นต่ำ 10 ตัว");
      setMessageType("error");
      return;
    }
    if (confirmPassword.length < 10) {
      setMessage("ยืนยันรหัสผ่านต้องขั้นต่ำ 10 ตัว");
      setMessageType("error");
      return;
    }

    // ตรวจสอบรูปแบบรหัสผ่านที่แข็งแกร่ง
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      setMessage("รหัสผ่านใหม่ต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่[A-Z], พิมพ์เล็ก[a-z], ตัวเลข[0-9] และอักขระพิเศษ[!@#$%^&*]");
      setMessageType("error");
      return;
    }
    if (!passwordRegex.test(confirmPassword)) {
      setMessage("ยืนยันรหัสผ่านต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่[A-Z], พิมพ์เล็ก[a-z], ตัวเลข[0-9] และอักขระพิเศษ[!@#$%^&*]);
      setMessageType("error");
      return;
    }

    // ตรวจสอบความถูกต้องของรหัสผ่านใหม่กับการยืนยันรหัสผ่าน
    if (newPassword !== confirmPassword) {
      setMessage("รหัสใหม่และการยืนยันรหัสไม่ตรงกัน");
      setMessageType("error");
      return;
    }

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    try {
      // ส่ง request ไปตรวจสอบรหัสเดิม
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
        // ถ้ารหัสเดิมถูกต้อง อัปเดตรหัสผ่านใหม่
        const updateResponse = await fetch(
          `${API_URL}/users/${user.user_id}/change-password`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              password: newPassword, // ส่งแค่รหัสผ่านใหม่
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
      console.error(err);
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
