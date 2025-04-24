"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import "@/app/css/resetPassword.css";

export default function ResetPassword() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const router = useRouter("");
  const [canEnterOTP, setCanEnterOTP] = useState(false);
  const [SentEmail, setSentEmail] = useState(true);

  const noSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/users/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();
      if (res.ok) {
        console.log(result);
        setMessage("ยืนยัน E-mail สำเร็จ กรุณาใส่ OTP");
        setMessageType("success");
        setCanEnterOTP(true);
        setSentEmail(false);
      } else {
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดระหว่างการยืนยัน", error);
      setMessageType("error");
    }
  };

  const reSentOTP = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/users/resent-reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();
      if (res.ok) {
        console.log(result);
        setMessage("ส่ง Token ใหม่สำเร็จ");
        setMessageType("success");
      } else {
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดระหว่างการยืนยัน", error);
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
    <div>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="reset_password_container">
        <div className="head-titel">
          <h1>ใส่ Email</h1>
        </div>
        <form onSubmit={noSubmit}>
          <div className="input">
            <input
              required
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // กรอกอีเมล
            />
            
            {/* แสดงกรอก OTP ถ้าได้รับสิทธิ์ให้กรอก OTP */}
            {canEnterOTP && (
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp} // ใช้ otp แทน email
                onChange={(e) => setOtp(e.target.value)} // เปลี่ยนจาก setEmail เป็น setOtp
              />
            )}
  
            {/* แสดงปุ่มขอ OTP ใหม่ ถ้ามีสิทธิ์ให้ขอ OTP */}
            {canEnterOTP && (
              <div className="btn">
                <button 
                  type="button"  // ใช้ type="button" เพื่อไม่ให้ฟอร์มถูกส่ง
                  className="btn"
                  onClick={reSentOTP}  // ใช้ onClick แทน onSubmit
                >
                  ขอ OTP ใหม่
                </button>
              </div>
            )}
            {canEnterOTP && (
              <div className="btn">
                <button 
                  type="button" 
                  className="btn"
                  onClick={verifyOTP} 
                >
                  ยืนยัน OTP
                </button>
              </div>
            )}
          </div>
  
          {/* ปุ่มยืนยันในฟอร์ม */}
          {SentEmail && (
            <div className="btn">
              <button className="btn" type="submit">
                ยืนยัน
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
  
}
