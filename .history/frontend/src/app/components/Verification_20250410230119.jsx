"use client";
import { useState, useEffect } from "react";
import "@/app/css/Verification.css";

export default function Verification() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  const data = JSON.parse(storedUser);
  const userId = data?.user_id;
  const userEmail = data?.email; 
 
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
        // setTimeout(() => {
        //   localStorage.removeItem("token");
        //   localStorage.removeItem("user");
        //   sessionStorage.removeItem("token");
        //   window.location.href = "/login";
        // }, 1500);
      } else {
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดระหว่างการยืนยัน", error);
      setMessageType("error");
    }
  };

  const requestOTP = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/register/new-otp/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userEmail }),
      });
  
      const result = await res.json(); 
  
      if (res.ok) {
        console.log("Verification successful:", result);
        alert("OTP ใหม่ถูกส่งแล้ว");
      } else {
        console.error("Verification failed:", result.message);
        alert(result.message || "Verification failed");
      }
    } catch (error) {
      console.error("Error during verification:", error);
      alert("เกิดข้อผิดพลาดในการขอ OTP");
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
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="verification-container">
        <div className="head-titel">
          <h1>ยืนยันบัญชี</h1>
        </div>
        <form onSubmit={noSave}>
          <div className="input">
            <input
              required
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <div className="btn-resend">
          <button type="button" onClick={requestOTP}>ขอรหัสใหม่</button>       
            <p> (OTP มีเวลา 5 นาที ถ้าหมดต้องกดขอใหม่) </p>
          </div>
          <div className="btn">
            <button className="btn" 
            type="submit">ยืนยัน</button>
          </div>
        </form>
      </div>
    </>
  );
}
