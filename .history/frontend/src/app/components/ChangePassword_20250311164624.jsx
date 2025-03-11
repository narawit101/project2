"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import "../css/changePassword.css";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // ตรวจสอบว่า รหัสใหม่และยืนยันรหัสใหม่ตรงกันหรือไม่
    if (newPassword !== confirmPassword) {
      setError("รหัสใหม่และการยืนยันรหัสไม่ตรงกัน");
      return;
    }

    // ตรวจสอบรหัสเดิม
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(storedUser);

    // เรียก API เพื่อตรวจสอบรหัสเดิม
    try {
      const response = await fetch(`${API_URL}/users/${user.user_id}/check-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword }),
      });

      const data = await response.json();

      if (data.success) {
        // หากรหัสเดิมถูกต้อง อัปเดตรหัสใหม่
        const updateResponse = await fetch(`${API_URL}/users/${user.user_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: newPassword }),
        });

        if (updateResponse.ok) {
          setSuccess("รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว");
          setError("");
        } else {
          setError("เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน");
        }
      } else {
        setError("รหัสเดิมไม่ถูกต้อง");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการตรวจสอบรหัสเดิม");
    }
  };

  return (
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

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <button type="submit" className="save-btn">บันทึก</button>
      </form>
    </div>
  );
}
