"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import "@/app/css/resetPassword.css";
import Link from "next/link";

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
  const [timer, setTimer] = useState(60); // เริ่มต้นจาก 60 วินาที
  const [canRequestOTP, setCanRequestOTP] = useState(true); // ใช้สำหรับการอนุญาตให้ผู้ใช้ขอ OTP ใหม่
  const [startProcessLoad, SetstartProcessLoad] = useState(false);

  useEffect(() => {
    const expiresAt = sessionStorage.getItem("expiresAt");

    if (Date.now() < expiresAt) {
      const user = JSON.parse(sessionStorage.getItem("user"));
    } else {
      sessionStorage.removeItem("expiresAt");
      sessionStorage.removeItem("user");
      router.replace("/resetPassword");
    }
  }, []);

  useEffect(() => {
    if (timer === 0) {
      setCanRequestOTP(true);
    } else if (!canRequestOTP) {
      const interval = setInterval(() => {
        setTimer((preTimer) => preTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, canRequestOTP]);

  const onSubmit = async (e) => {
    e.preventDefault();
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const res = await fetch(`${API_URL}/users/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage(`ส่ง OTP ไปที่ ${email} สำเร็จ`);
        setMessageType("success");
        sessionStorage.setItem("user", JSON.stringify(result.user)); // เก็บข้อมูลผู้ใช้
        sessionStorage.setItem("expiresAt", JSON.stringify(result.expiresAt)); // เก็บเวลา expiresAt
        setCanEnterOTP(true);
        setSentEmail(false);
        setCanRead(false);
      } else {
        sessionStorage.removeItem("user", JSON.stringify(result));
        sessionStorage.removeItem("expiresAt", result);
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาด", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const reSentOTP = async (e) => {
    e.preventDefault();

    if (!canRequestOTP) {
      setMessage("กรุณารอสักครู่ก่อนขอ OTP ใหม่");
      setMessageType("error");
      return;
    }
    setCanRequestOTP(false);
    setTimer(60);
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const res = await fetch(`${API_URL}/users/resent-reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage(`ส่ง OTP ใหม่ไปที่ ${email} สำเร็จ`);
        setMessageType("success");
        sessionStorage.setItem("user", JSON.stringify(result.user)); // เก็บข้อมูลผู้ใช้
        sessionStorage.setItem("expiresAt", JSON.stringify(result.expiresAt)); // เก็บเวลา expiresAt
      } else {
        sessionStorage.removeItem("user", JSON.stringify(result));
        sessionStorage.removeItem("expiresAt", result);
        router.replace("/resetPassword");
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาด", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();

    const user_id = sessionStorage.getItem("user");

    if (!user_id) {
      setMessage("ไม่พบข้อมูลผู้ใช้ในระบบ");
      setMessageType("error");
      return;
    }
    SetstartProcessLoad(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const res = await fetch(`${API_URL}/users/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage("ยืนยัน OTP สำเร็จ กำลังเข้าสู่การรีเซ็ตรหัสผ่าน");
        setMessageType("success");
        setTimeout(() => {
          router.replace("/confirmResetPassword");
        }, 1500);
      } else {
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาด", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
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

  // if (startProcessLoad)
  //   return (
  //     <div className="loading-overlay">
  //       <div className="loading-spinner"></div>
  //     </div>
  //   );

  return (
    <div>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="reset_password_container">
        <div className="head-titel">
          <h1>ลืมรหัสผ่าน</h1>
        </div>
        {canRead && (
          <form onSubmit={onSubmit}>
            <div className="input-foget-password">
              <input
                maxLength={100}
                required
                type="email"
                placeholder="ใส่ Email ของคุณ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {sentEmail && (
              <div className="btn-submit-reset-password">
                <button
                  type="submit"
                  style={{
                    cursor: startProcessLoad ? "not-allowed" : "pointer",
                  }}
                  disabled={startProcessLoad}
                >
                  ยืนยัน
                </button>
              </div>
            )}
          </form>
        )}
        {!canRead && (
          <div className="input-foget-password">
            <input readOnly required value={email} />
          </div>
        )}
        {canEnterOTP && (
          <div className="input-foget-password">
            <input
              required
              type="text"
              minLength={6}
              maxLength={6}
              placeholder="ใส่ OTP"
              value={otp}
              onChange={(e) => setOTP(e.target.value)}
            />
          </div>
        )}
        {canEnterOTP && (
          <div className="btn-resend">
            <button
              style={{
                cursor: startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={!canEnterOTP}
              type="button"
              onClick={reSentOTP}
            >
              ขอ OTP ใหม่
            </button>
          </div>
        )}
        {!canRequestOTP && <p>กรุณารอ {timer} วินาทีก่อนขอ OTP ใหม่</p>}
        {canEnterOTP && (
          <div className="btn-submit-reset-password">
            <button
              type="button"
              style={{
                cursor: startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={startProcessLoad}
              onClick={verifyOTP}
            >
              ยืนยัน OTP
            </button>
          </div>
        )}

        <Link href="/login" className="login-reset-password">
          กลับหน้า Login
        </Link>
        {startProcessLoad && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
}
