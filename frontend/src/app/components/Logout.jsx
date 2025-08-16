"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/logout.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

export default function LogoutButton() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const router = useRouter();
  const { setUser } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad);

  const handleLogout = async () => {
    SetstartProcessLoad(true);
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("เกิดข้อผิดพลาดระหว่างออกจากระบบ");
      }
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      setMessage("ออกจากระบบสำเร็จ");
      setMessageType("error");
      router.push("/login");
    } catch (error) {
      console.error("Error:", error);
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error);
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

  return (
    <div>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="logout-container">
        <button className="logout-button" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>{" "}
          <img
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755271167/bx--log-out_eq26uh.png"
            width={20}
            height={20}
            alt=""
          />
          {startProcessLoad ? (
            <span className="dot-loading">
              <span className="dot one">●</span>
              <span className="dot two">●</span>
              <span className="dot three">●</span>
            </span>
          ) : (
            "ออกจากระบบ"
          )}
        </button>
      </div>
    </div>
  );
}
