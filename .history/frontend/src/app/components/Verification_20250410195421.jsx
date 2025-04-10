"use client";
import { useState,useEffect } from "react";

export default function Verification() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  const data = JSON.parse(storedUser);
  const userId = data.user_id;

  const noSave = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/register/verify/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp }),
      });

      const result = await res.json();
      if (res.ok) {
        console.log(result);
        setMessage("ยืนยัน E-mail สำเร็จ");
        setMessageType("success");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");  
        // window.location.href = "/login"; 
      } else {
        console.error("การยืนยันล้มเหลว:", result.message);
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดระหว่างการยืนยัน:", error);
      setMessage("เกิดข้อผิดพลาดระหว่างการยืนยัน");
      setMessageType("error");
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

  return (
    <div className="verification-container">
      <h1>Verification</h1>
      <form onSubmit={noSave}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <button type="submit">Verify</button>
      </form>
    </div>
  );
}
