"use client";
import { useState, useEffect } from "react";
import "@/app/css/Verification.css";

export default function Verification() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [timer, setTimer] = useState(60);  // เริ่มต้นจาก 60 วินาที
  const [canRequestOTP, setCanRequestOTP] = useState(true);  // ใช้สำหรับการอนุญาตให้ผู้ใช้ขอ OTP ใหม่

  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  const data = JSON.parse(storedUser);
  const userId = data?.user_id;
  const userEmail = data?.email;

  useEffect(() => {
    if (timer === 0) {
      setCanRequestOTP(true);  // เมื่อเวลา 0, ให้ผู้ใช้ขอ OTP ใหม่ได้
    } else if (!canRequestOTP) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval);  // ล้าง interval เมื่อ component ถูก unmount
    }
  }, [timer, canRequestOTP]);
 
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
      if (!canRequestOTP) {
        setMessage("กรุณารอสักครู่ก่อนขอ OTP ใหม่");
        setMessageType("success");
        return;
      }
      setCanRequestOTP(false);
      setTimer(60);
      const res = await fetch(`${API_URL}/register/new-otp/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });
  
      const result = await res.json(); 
  
      if (res.ok) {
        console.log(result);
        setMessage(`OTP ใหม่ถูกส่งไปยัง ${userEmail}`);
        setMessageType("success");
      } else {
        console.error(result.message);
        setMessage(result.message || "เกิดข้อผิดพลาดระหว่างการส่งข้อมูล");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("เกิดข้อผิดพลาดในการขอ OTP");
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
          <button disabled={!canRequestOTP} type="button" onClick={requestOTP}>ขอรหัสใหม่</button> 
          {!canRequestOTP &&(
            <p>กรุณารอ {timer} วินาทีก่อนขอ OTP ใหม่</p>
          )}      
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
