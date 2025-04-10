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
        // localStorage.removeItem("token");
        // localStorage.removeItem("user");
        // sessionStorage.removeItem("token");
        // window.location.href = "/login";
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
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="verification-container">
        <div className="head">
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
          <div className="resend">
            <a href="">sadasd</a>
          </div>
          <div className="btn">
            <button type="submit">ยืนยัน</button>
          </div>
        </form>
      </div>
    </>
  );
}
