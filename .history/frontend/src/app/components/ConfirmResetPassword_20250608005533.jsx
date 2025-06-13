"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import "@/app/css/confirmResetPassword.css";

export default function ConfirmResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter("");
  const [startProcessLoad, SetstartProcessLoad] = useState(false);

  useEffect(() => {
    const expiresAt = JSON.parse(sessionStorage.getItem("expiresAt"));
    if (Date.now() < expiresAt) {
      const user = JSON.parse(sessionStorage.getItem("user"));
    } else {
      sessionStorage.removeItem("expiresAt");
      sessionStorage.removeItem("user");
      router.replace("/resetPassword");
    }
  }, []);

  const handlePasswordChange = async (e) => {
    const user_id = sessionStorage.getItem("user");

    if (!user_id) {
      setMessage("session หมดอายุกรุณาทำรายการใหม่");
      setMessageType("error");
      setTimeout(() => {
        router.replace("/resetPassword");
      }, 2000);
      return;
    }

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
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      setMessage(
        "รหัสผ่านใหม่ต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่[A-Z], พิมพ์เล็ก[a-z], ตัวเลข[0-9] และอักขระพิเศษ[!@#$%^&*]"
      );
      setMessageType("error");
      return;
    }
    if (!passwordRegex.test(confirmPassword)) {
      setMessage(
        "ยืนยันรหัสผ่านต้องประกอบด้วยตัวอักษรพิมพ์ใหญ่[A-Z], พิมพ์เล็ก[a-z], ตัวเลข[0-9] และอักขระพิเศษ[!@#$%^&*]"
      );
      setMessageType("error");
      return;
    }

    const user = JSON.parse(sessionStorage.getItem("user"));
    if (newPassword !== confirmPassword) {
      setMessage("รหัสไม่ตรงกัน");
      setMessageType("error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const response = await fetch(
        `${API_URL}/users/${user.user_id}/change-password-reset`,
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
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("expiresAt");
        setTimeout(() => {
          router.replace("/login");
        }, 2000);
      } else {
        setMessage(result.message || "เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("เกิดข้อผิดพลาด", err);
      setMessageType("error");
      console.error(err);
    } finally {
      SetstartProcessLoad(false);
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

  // if (startProcessLoad)
  //   return (
  //     <div className="loading-overlay">
  //       <div className="loading-spinner"></div>
  //     </div>
  //   );

  return (
    <div>
      <div className="confirm-reset-password-container">
        {message && (
          <div className={`message-box ${messageType}`}>
            <p>{message}</p>
          </div>
        )}

        <div className="confirm-reset-password-head-titel">
          <h1>เปลี่ยนรหัสผ่าน</h1>
        </div>

        <form
          action={handlePasswordChange}
          className="confirm-reset-password-form"
        >
          <label className="newpassword-title">รหัสใหม่</label>
          <div className="input-comfirm-resert">
            <input
              maxLength={50}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <label className="newpassword-title">ยืนยันรหัสใหม่</label>
          <div className="input-comfirm-resert">
            <input
              maxLength={50}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="btn-confirm-reset-password">
            <button type="submit">ยืนยัน</button>
          </div>
          {startProcessLoad && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
