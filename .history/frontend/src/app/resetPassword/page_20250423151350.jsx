"use client"
import React, { useState } from "react";


export default function ResetPassword() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [email, SetEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  return <div>
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
    
          <div className="btn">
            <button className="btn" type="submit">
              ยืนยัน
            </button>
          </div>
        </form>
      </div>
  </div>;
}
