"use client";
import React, { useState, useEffect, useRef } from "react";
import LogoutButton from "@/app/components/LogoutButton";
import "@/app/css/Nav.css";
import Cookies from 'js-cookie';

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null); 
  const dropdownRef = useRef(null);
  const userProfileRef = useRef(null); 

  useEffect(() => {
// ใช้ js-cookie เพื่อดึง token
const token = Cookies.set('token');

if (token) {
  console.log("Token ที่ดึงจาก cookie:", token);
} else {
  console.log("ไม่พบ token ใน cookie");
}

    const storedUser = localStorage.getItem("user");
    
    try {
      // ตรวจสอบว่า storedUser มีค่าหรือไม่ก่อนการแปลง
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      setUser(null); // กรณีที่ JSON.parse() ล้มเหลว
    }

    const expiresAt = localStorage.getItem("expiresAt");

    // ตรวจสอบว่า user, expiresAt ถูกเก็บไว้และไม่หมดอายุ
    if (!storedUser || !expiresAt || Date.now() > parseInt(expiresAt)) {
      localStorage.removeItem("user");
      localStorage.removeItem("expiresAt");
      setUser(null);
      return;
    }

    // หากไม่มีข้อผิดพลาดในการแปลงข้อมูล, เราตั้งค่าตามปกติ
    try {
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error parsing user data on initial load:", error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !userProfileRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav>
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
        {/* ปุ่มค้นหาลอย */}
        <div className="search-container" ref={searchRef}>
          <button className="search-button" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            🔍
          </button>
          <input 
            type="text" 
            placeholder="ค้นหา..." 
            className={`search-box ${isSearchOpen ? "active" : ""}`} 
          />
        </div>

        {user ? (
          <div
            className={`user-profile ${isDropdownOpen ? "active" : ""}`}
            onClick={toggleDropdown} 
            ref={userProfileRef}  
          >
            <span className="user-name">{user.user_name || "ผู้ใช้"}</span>

            {/* Dropdown เมนู */}
            <div className="dropdown" ref={dropdownRef}>
              <ul>
                {user.role === "customer" &&  <li><a href="/editprofile">แก้ไขโปรไฟล์</a></li>}
                {user.role === "customer" && <li><a href="/reservations">ดูรายละเอียดการจอง</a></li>}
                {user.role === "customer" && <li><a href="/registerField">ลงทะเบียนสนาม</a></li>}
                {user.role === "field_owner" && <li><a href="/editprofile">แก้ไขโปรไฟล์</a></li>}
                {user.role === "field_owner" && <li><a href="/registerField">ลงทะเบียนสนาม</a></li>}
                {user.role === "field_owner" && <li><a href="/myfield">สนามของฉัน</a></li>}
                {user.role === "admin" && <li><a href="/editprofile">แก้ไขโปรไฟล์</a></li>}
                {user.role === "admin" && <li><a href="/manager">จัดการผู้ใช้</a></li>}
                {user.role === "admin" && <li><a href="/myfield">จัดการสนามกีฬา</a></li>}
                {user.role === "admin" && <li><a href="/addfac">จัดการสิ่งอำนวยความสะดวก</a></li>}
                {user.role === "admin" && <li><a href="/addtype">จัดการประเภทกีฬา</a></li>}
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
