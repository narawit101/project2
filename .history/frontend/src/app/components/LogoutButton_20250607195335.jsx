"use client";
import React, { useState } from "react";
import "@/app/css/logoutbtn.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";

export default function LogoutButton() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [message, setMessage] = useState("");
  const router = useRouter("");
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
      router.replace("/login");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      SetstartProcessLoad(false);
    }
  };

  if (startProcessLoad)
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    );

  return (
    <div className="logout-container">
      {message && <p className="error-message">{message}</p>}
      <button className="logout-button" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt"></i>ออกจากระบบ
      </button>
    </div>
  );
}
