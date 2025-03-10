"use client";
import React, { useState } from "react";
import "../css/logoutbtn.css";

export default function LogoutButton() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [message, setMessage] = useState("");

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("เกิดข้อผิดพลาดระหว่างออกจากระบบ");
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");  
      window.location.href = "/"; 
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="logout-container">
      {message && <p className="error-message">{message}</p>}
      <button className="logout-button" onClick={handleLogout}>
        <a className="fas fa-sign-out-alt"></a>ออกจากระบบ
      </button>
    </div>
  );
}
