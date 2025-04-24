"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function ResetPassword() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [email, SetEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const router = useRouter("");

  const noSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/user/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();
      if (res.ok) {
        console.log(result);
        setMessage("ยืนยัน Token");
        setMessageType("success");
        setInterval(() => {
          router.push("/confirm_reset_password");
        }, 1000);
      } else {
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดระหว่างการยืนยัน", error);
      setMessageType("error");
    }
  };

  return (
    <div>
      <div className="reset_password_container">
        <div className="head-titel">
          <h1>ใส่ Email</h1>
        </div>
        <form onSubmit={noSubmit}>
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
    </div>
  );
}
