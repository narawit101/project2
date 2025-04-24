"use client"
import React, { useState } from "react";


export default function ResetPassword() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [email, SetEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  return <div>
     <div className="reset_password_container">
        <div className="head-titel">
          <h1>ใส่ Email</h1>
        </div>
        <form >
          <div className="input">
            <input
              required
              type="text"
              placeholder="Enter OTP"
              value
              onChange={(e) => SetEmail(e.target.value)}
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
