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
  const [sentEmail, setSentEmail] = useState(true);
  const [canRead, setCanRead] = useState(true);

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("token"));
    const expiresAt = JSON.parse(localStorage.getItem("expiresAt"));

    if (token && Date.now() < expiresAt) {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.status !== "ตรวจสอบแล้ว") {
        router.push("/verification");
      }
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("expiresAt");
      localStorage.removeItem("user");
      router.push("/resetPassword");
    }
  }, []);

  const onSubmit = async (e) => {
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
        setMessage(`ส่ง OTP ไปที่ ${email} สำเร็จ`);
        setMessageType("success");
        localStorage.setItem("token", JSON.stringify(result.token)); // เก็บ token
        localStorage.setItem("user", JSON.stringify(result.user)); // เก็บข้อมูลผู้ใช้
        localStorage.setItem("expiresAt", JSON.stringify(result.expiresAt)); // เก็บเวลา expiresAt
        setCanEnterOTP(true);
        setSentEmail(false);
        setCanRead(false);
      } else {
        localStorage.removeItem("token", result);
        localStorage.removeItem("user", JSON.stringify(result));
        localStorage.removeItem("expiresAt", result);
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();
      if (res.ok) {
        console.log(result);
        setMessage(`ส่ง OTP ใหม่ไปที่ ${email} สำเร็จ`);
        setMessageType("success");
        localStorage.setItem("token", JSON.stringify(result.token)); // เก็บ token
        localStorage.setItem("user", JSON.stringify(result.user)); // เก็บข้อมูลผู้ใช้
        localStorage.setItem("expiresAt", JSON.stringify(result.expiresAt)); // เก็บเวลา expiresAt
      } else {
        localStorage.removeItem("token", result);
        localStorage.removeItem("user", JSON.stringify(result));
        localStorage.removeItem("expiresAt", result);
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดระหว่างการยืนยัน", error);
      setMessageType("error");
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();

    const user_id = localStorage.getItem("user");

    if (!user_id) {
      setMessage("ไม่พบข้อมูลผู้ใช้ในระบบ");
      setMessageType("error");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/verify-otp`, {
        method: "POST", // ใช้ POST สำหรับการยืนยัน OTP
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }), // ส่งอีเมลและ OTP
      });

      const result = await res.json();
      if (res.ok) {
        setMessage("ยืนยัน OTP สำเร็จ");
        setMessageType("success");
        setTimeout(() => {
          router.push("/confirmResetPassword");
        }, 1500);
      } else {
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดระหว่างการยืนยัน OTP", error);
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
        {canRead && (
          <form onSubmit={onSubmit}>
            <div className="input">
              <input
                required
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {sentEmail && (
              <div className="btn">
                <button className="btn" type="submit">
                  ยืนยัน
                </button>
              </div>
            )}
          </form>
        )}

        <form onSubmit={onSubmit}>
          <div className="input">
            <input
              readOnly
              required
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </form>
        {canEnterOTP && (
          <input
            type="text"
            required
            placeholder="ใส่ OTP"
            value={otp}
            onChange={(e) => setOTP(e.target.value)}
          />
        )}
        {canEnterOTP && (
          <div className="btn">
            <button type="button" className="btn" onClick={reSentOTP}>
              ขอ OTP ใหม่
            </button>
          </div>
        )}
        {canEnterOTP && (
          <div className="btn">
            <button type="button" className="btn" onClick={verifyOTP}>
              ยืนยัน OTP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
