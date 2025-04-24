"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import "@/app/css/confirmResetPassword.css";

export default function ConfirmResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter("");

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("token"));
    const expiresAt = JSON.parse(localStorage.getItem("expiresAt"));
    if (token && Date.now() < expiresAt) {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.status !== "ตรวจสอบแล้ว") {
        router.push("/verification");
      }
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("expiresAt");
      localStorage.removeItem("user");
      router.push("/resetPassword");
    }
  }, []);

  const handlePasswordChange = async (e) => {
    if(newPassword.length || confirmPassword.length <10){
      setMessage("รหัสผ่านต้องขั้นต่ำ 10 ตัว")
    }
    const user = JSON.parse(localStorage.getItem("user"));
    if (newPassword !== confirmPassword) {
      setMessage("รหัสไม่ตรงกัน");
      setMessageType("error");
      return;
    }

    try {
      if (user) {
        setMessage("ไม่พบข้อมูลผู้ใช้ในระบบ");
        setMessageType("error");
        setTimeout(() => {
          router.push("/resetPassword");
        }, 2000);
        return;
      }
      const response = await fetch(
        `${API_URL}/users/${user.user_id}/change-password/reset`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: newPassword,
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        setMessage("รหัสผ่านถูกเปลี่ยนเรียบร้อย กรุณาเข้าสู่ระบบอีกครั้ง");
        setMessageType("success");
        setConfirmPassword("");
        setNewPassword("");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("expiresAt");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setMessage(result.message || "เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("เกิดข้อผิดพลาด", err);
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
      <div className="container">
      <div className="head-titel">
          <h1>เปลี่ยนรหัสผ่าน</h1>
        </div>
        <form action={handlePasswordChange}>
          <label>รหัสใหม่</label>
          <div className="input">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <label>ยืนยันรหัสใหม่</label>
          <div className="input">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="btn">
            <button type="submit" className="btn">
              ยืนยัน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
