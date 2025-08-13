"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import "@/app/css/login.css";
import { useAuth } from "@/app/contexts/AuthContext";
import Link from "next/link";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

export default function Login() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { user, setUser, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  usePreventLeave(startProcessLoad);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(redirect);
    }
  }, [user, isLoading, redirect]);

  useEffect(() => {
    const msg = sessionStorage.getItem("login_message");
    if (msg) {
      setMessage({ text: msg, type: "error" });
      sessionStorage.removeItem("login_message");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    SetstartProcessLoad(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ text: data.message || "เกิดข้อผิดพลาด", type: "error" });
        return;
      }

      const res = await fetch(`${API_URL}/users/me`, {
        credentials: "include",
      });

      if (res.ok) {
        setMessage({ text: "เข้าสู่ระบบสำเร็จ", type: "success" });
        const userData = await res.json();
        setUser(userData);
        router.push(redirect);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ text: "เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ", type: "error" });
    } finally {
      SetstartProcessLoad(false);
    }
  };

  return (
    <div className="login-container">
      <h2>เข้าสู่ระบบ</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group-login">
          <label htmlFor="identifier">ชื่อผู้ใช้หรืออีเมล:</label>
          <input
            maxLength={100}
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
          />
        </div>
        <div className="input-group-login">
          <label htmlFor="password">รหัสผ่าน:</label>
          <div className="password-wrapper-login">
            <input
              maxLength={100}
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              className="toggle-password-btn-login"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "ซ่อน" : "แสดง"}
            </button>
          </div>
        </div>
        <button
          className="login-button"
          type="submit"
          disabled={startProcessLoad}
        >
          {startProcessLoad ? (
            <span className="dot-loading">
              <span className="dot one">●</span>
              <span className="dot two">●</span>
              <span className="dot three">●</span>
            </span>
          ) : (
            "เข้าสู่ระบบ"
          )}
        </button>

        <div className="reset-password">
          <Link href="/reset-password" className="reset-link">
            ลืมรหัสผ่าน
          </Link>
          <Link href="/register" className="register-link">
            ลงทะเบียน
          </Link>
        </div>
      </form>

      {message.text && (
        <div className={`message ${message.type}`}>
          <div>{message.text}</div>
        </div>
      )}
    </div>
  );
}
