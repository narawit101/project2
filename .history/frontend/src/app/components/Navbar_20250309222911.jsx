'use client'
import React, { useState } from "react";
import LogoutButton from "./LogoutButton";
import "../css/Nav.css";

export default function Navbar({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h2 className="logo">⚽</h2>
        <ul className={isOpen ? "nav-menu active" : "nav-menu"}>
          <li><a href="/">หน้าแรก</a></li>
          <li><a href="/categories">หมวดหมู่</a></li>
          <li><a href="/contact">ติดต่อเรา</a></li>
          <li><input type="text" placeholder="🔍 ค้นหา..." className="search-box" /></li>
          {user ? (
            <li className="dropdown">
              <button 
                className="dropbtn" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                👤 {user.name} ▼
              </button>
              {isDropdownOpen && (
                <div className="dropdown-content">
                  <a href="/profile">แก้ไขโปรไฟล์</a>
                  {user.role === "user" && <a href="/reservations">ดูรายละเอียดการจอง</a>}
                  {user.role === "owner" && <a href="/register-field">ลงทะเบียนสนาม</a>}
                  {user.role === "admin" && <a href="/manage-users">จัดการผู้ใช้</a>}
                  <LogoutButton />
                </div>
              )}
            </li>
          ) : (
            <li><a href="/login">เข้าสู่ระบบ / สมัครสมาชิก</a></li>
          )}
        </ul>
        <div className="hamburger" onClick={() => setIsOpen(!isOpen)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
}
