'use client'
import React, { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import "../css/nav.css";

export default function Navbar({ user }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // สมมติว่า token เก็บใน localStorage
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  return (
    <nav>
      <h2 className="logo">⚽ Sport Booking</h2>
      <ul>
        <li><a href="/">หน้าแรก</a></li>
        <li><a href="/categories">หมวดหมู่</a></li>
        <li><a href="/contact">ติดต่อเรา</a></li>
      </ul>
      <div className="user">
        <input type="text" placeholder="🔍 ค้นหา..." />
        {token ? (
          <div 
            className={`user-profile ${isDropdownOpen ? "active" : ""}`} 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="profile-icon">👤</span>
            <span className="user-name">{user?.name || "ผู้ใช้"}</span>
            <div className="dropdown">
              <ul>
                <li><a href="/profile">แก้ไขโปรไฟล์</a></li>
                {user?.role === "user" && <li><a href="/reservations">ดูรายละเอียดการจอง</a></li>}
                {user?.role === "owner" && <li><a href="/register-field">ลงทะเบียนสนาม</a></li>}
                {user?.role === "admin" && <li><a href="/manage-users">จัดการผู้ใช้</a></li>}
                <li><LogoutButton /></li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <a href="/login" className="login">เข้าสู่ระบบ</a>
            <a href="/register" className="register">สมัครสมาชิก</a>
          </>
        )}
      </div>
    </nav>
  );
}
