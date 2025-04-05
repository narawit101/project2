"use client";

import React, { useState, useEffect, useContext } from "react"; // เพิ่ม useContext
import LogoutButton from "./LogoutButton";
import "@/app/css/Nav.css";
import { UserContext } from "@/app/context/UserContext"; // ตรวจสอบให้มั่นใจว่า import ถูกต้อง

export default function Navbar() {
  const { currentUser } = useContext(UserContext); // ดึงข้อมูลจาก context
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setToken(storedToken);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav>
      {currentUser ? (
        <p>สวัสดี, {currentUser.name}</p> // แสดงชื่อผู้ใช้ที่ดึงจาก Context
      ) : (
        <p>กรุณาเข้าสู่ระบบ</p>
      )}
      <a href="/" className="logo">⚽</a>

      {/* เมนูหลัก */}
      <div className="ullist">
        <ul className={isMenuOpen ? "active" : ""}>
          <li><a href="/">หน้าแรก</a></li>
          <li><a href="/categories">หมวดหมู่</a></li>
          <li><a href="/contact">ติดต่อเรา</a></li>
        </ul>
        <div className="hamburger" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>

      {/* ส่วนของ User */}
      <div className="user">
        {token && user ? (
          <div
            className={`user-profile ${isDropdownOpen ? "active" : ""}`}
            onClick={toggleDropdown}
          >
            <span className="user-name">{user.user_name || "ผู้ใช้"}</span>

            {/* Dropdown เมนู */}
            <div className="dropdown">
              <ul>
                <li><a href="/editprofile">แก้ไขโปรไฟล์</a></li>
                <LogoutButton />
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
