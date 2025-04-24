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

  const handlePasswirdChange = async (e) => {
    e.preventDedault();

    if (newPassword !== confirmPassword) {
      setMessage("รหัสไม่ตรงกัน");
      setMessageType("error");
      return;
    }
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_URL}/users/${user.user_id}/change-password,`,
        {
          method: "PUT",
          headers: {
            "Content-type": "application/json",
            Authoriaztion: `Bearer ${token}`,
          },
          body: JSON.stringify({
            password: newPassword,
          }),
        }
      );

      if (response.ok) {
        setMessage("รหัสผ่านถูกเปลี่ยนเรียบร้อย กรุณาเข้าสู่ระบบอีกครั้ง");
        setMessageType("success");
        setConfirmPassword("");
        setNewPassword("");
        localStorage.removeItem("token", response);
        localStorage.removeItem("user", JSON.stringify(response));
        localStorage.removeItem("expiresAt", response);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setMessage("เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("เกิดข้อผิดผลาด");
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
        <form action={handlePasswirdChange}>
        <label>รหัสใหม่</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <label>ยืนยันรหัสใหม่</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        </form>
      </div>
    </div>
  );
}
