"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/logoutbtn.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

export default function LogoutButton() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [message, setMessage] = useState(""); // State for messages
  const [messageType, setMessageType] = useState(""); // State for message type (error, success)
  const router = useRouter();
  const { setUser } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);

  const handleLogout = async () => {
    SetstartProcessLoad(true);
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("เกิดข้อผิดพลาดระหว่างออกจากระบบ");
      }
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      setMessage("ออกจากระบบสำเร็จ");
      setMessageType("error");
      router.replace("/login");
    } catch (error) {
      console.error("Error:", error);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (startProcessLoad)
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    );

  return (
    <div className="logout-container">
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <button className="logout-button" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt"></i>ออกจากระบบ
      </button>
    </div>
  );
}
