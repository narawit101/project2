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
  const [setSentEmail, setSentEmail] = useState(true);

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
        setMessage("ยืนยัน Token สำเร็จ");
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
              placeholder="Enter OTP"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {canEnterOTP && (
              <input
                required
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
            {canEnterOTP && (
              <div className="btn">
                <button className="btn" onClick={reSentOTP}>
                  ขอ OTP ใหม่
                </button>
              </div>
            )}
            {canEnterOTP && (
              <div className="btn">
                <button className="btn" onClick={reSentOTP}>
                  ยืนยัน OTP
                </button>
              </div>
            )}
          </div>
          {sentOTP && (
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
