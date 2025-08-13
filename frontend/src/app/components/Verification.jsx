"use client";
import { useState, useEffect, use } from "react";
import "@/app/css/user-verification.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

export default function Verification() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [timer, setTimer] = useState(60);
  const [canRequestOTP, setCanRequestOTP] = useState(true);
  const router = useRouter("");
  const { user, isLoading, setUser } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user?.status === "ตรวจสอบแล้ว") {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  const userId = user?.user_id;
  const userEmail = user?.email;

  useEffect(() => {
    if (timer === 0) {
      setCanRequestOTP(true);
    } else if (!canRequestOTP) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer, canRequestOTP]);

  const onSave = async (e) => {
    e.preventDefault();
    SetstartProcessLoad(true);
    try {
      const res = await fetch(`${API_URL}/register/verify/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ otp }),
      });

      const result = await res.json();
      if (res.ok) {
        setMessage("ยืนยัน E-mail สำเร็จ");
        setMessageType("success");
        setTimeout(() => {
          window.location.replace("/");
        }, 2000);
      } else {
        setMessage(result.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("เกิดข้อผิดพลาดระหว่างการยืนยัน", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const requestOTP = async (e) => {
    e.preventDefault();

    if (!canRequestOTP) {
      setMessage("กรุณารอสักครู่ก่อนขอ OTP ใหม่");
      setMessageType("success");
      return;
    }

    SetstartProcessLoad(true);
    try {
      const res = await fetch(`${API_URL}/register/new-otp/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: userEmail }),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage(`OTP ใหม่ถูกส่งไปยัง ${userEmail}`);
        setMessageType("success");
        setCanRequestOTP(false);
        setTimer(60);
      } else {
        console.error(result.message);
        setMessage(result.message || "เกิดข้อผิดพลาดระหว่างการส่งข้อมูล");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("เกิดข้อผิดพลาดในการขอ OTP");
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

  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="verification-container">
        <div className="head-titel">
          <h1>ยืนยันบัญชีของคุณก่อนใช้บริการ</h1>
        </div>
        <form onSubmit={onSave}>
          <div className="input-verify">
            <input
              required
              maxLength={6}
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <div className="btn-submit-verify">
            <button
              type="submit"
              style={{
                cursor: startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={startProcessLoad}
            >
              {startProcessLoad ? (
                <span className="dot-loading">
                  <span className="dot one">●</span>
                  <span className="dot two">●</span>
                  <span className="dot three">●</span>
                </span>
              ) : (
                "ยืนยัน E-mail"
              )}
            </button>
          </div>
          <div className="btn-resend-otp">
            <button
              style={{
                cursor:
                  !canRequestOTP || startProcessLoad
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={!canRequestOTP}
              type="button"
              onClick={requestOTP}
            >
              ขอรหัสใหม่
            </button>
            {!canRequestOTP && <p>กรุณารอ {timer} วินาทีก่อนขอ OTP ใหม่</p>}
            <p> (OTP มีเวลา 5 นาที ถ้าหมดต้องกดขอใหม่) </p>
          </div>
        </form>
      </div>
    </>
  );
}
