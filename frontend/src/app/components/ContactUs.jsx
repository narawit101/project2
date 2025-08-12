"use client";
import { useState, useEffect } from "react";
import "@/app/css/contact-us.css";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import { useRouter } from "next/navigation";

export default function Contact() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [userEmail, setUserEmail] = useState("");
  const [subJect, setSubject] = useState("");
  const [conTent, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [timer, setTimer] = useState(60);
  const [canRequest, setCanRequest] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (timer === 0) {
      setCanRequest(true);
    } else if (!canRequest) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer, canRequest]);

  const request = async (e) => {
    e.preventDefault();

    if (!canRequest) {
      setMessage("กรุณารอสักครู่ก่อนส่งคำขอใหม่");
      setMessageType("error");
      return;
    }
    if (!userEmail || !subJect || !conTent) {
      setMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
      setMessageType("error");
      return;
    }

    SetstartProcessLoad(true);
    try {
      const res = await fetch(`${API_URL}/users/contact-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          subJect: subJect,
          conTent: conTent,
        }),
      });

      const result = await res.json();

      if (res.status === 429 && result.code === "RATE_LIMIT") {
        router.push("/api-rate-limited");
        return;
      }

      if (res.ok) {
        setMessage(
          `ส่งข้อความเรียบร้อย กรุณารอข้อความตอบกลับจากผู้ดูแลระบบที่ ${userEmail}`
        );
        setMessageType("success");
        setCanRequest(false);
        setTimer(60);
        setUserEmail("");
        setSubject("");
        setContent("");
      } else {
        console.error(result.message);
        setMessage(result.message || "เกิดข้อผิดพลาดระหว่างการส่งข้อมูล");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("เกิดข้อผิดพลาดในการส่งคำขอ");
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
      }, 5000);

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
      <div className="contact-container">
        <div className="head-titel-contact">
          <h1>ติดต่อผู้ดูแลระบบ</h1>
        </div>
        <form onSubmit={request}>
          <div className="input-contact">
            <input
              readOnly={startProcessLoad}
              required
              type="email"
              placeholder="Email ของคุณ (สำหรับการตอบกลับ)"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />

            <input
              required
              readOnly={startProcessLoad}
              maxLength={50}
              type="text"
              placeholder="หัวข้อ, เรื่องที่ต้องการติดต่อ"
              value={subJect}
              onChange={(e) => setSubject(e.target.value)}
            />

            <textarea
              readOnly={startProcessLoad}
              maxLength={500}
              required
              type="text"
              placeholder="เนื้อหา, ข้อความที่ต้องการติดต่อ, แจ้งปัญหา, ข้อเสนอแนะ"
              value={conTent}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="btn-send-contact">
            <button
              style={{
                cursor:
                  !canRequest || startProcessLoad ? "not-allowed" : "pointer",
              }}
              disabled={!canRequest}
              type="button"
              onClick={request}
            >
              {startProcessLoad ? (
                <span className="dot-loading">
                  <span className="dot one">●</span>
                  <span className="dot two">●</span>
                  <span className="dot three">●</span>
                </span>
              ) : (
                "ส่งข้อความ"
              )}
            </button>
            {!canRequest && <p>กรุณารอ {timer} วินาทีก่อนส่งข้อความ</p>}
          </div>
        </form>
      </div>
    </>
  );
}
