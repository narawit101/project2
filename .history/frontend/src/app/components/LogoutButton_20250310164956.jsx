"use client";

import React, { useState } from "react";

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
      sessionStorage.removeItem("token");  
      window.location.href = "/"; 
    } catch (error) {
      console.error("Error:", error);
    }
  };
  
  return (
    <div>
      {message && <p>{message}</p>}
      <button onClick={handleLogout} style={{ backgroundColor: "red", color: "white", padding: "10px", border: "none", cursor: "pointer" }}>
        Logout
      </button>
    </div>
  );
}
