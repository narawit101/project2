"use client";
import React, { useState, useEffect, useRef } from "react";
import LogoutButton from "@/app/components/LogoutButton";
import "@/app/css/Nav.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";


export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null); 
  const dropdownRef = useRef(null);
  const userProfileRef = useRef(null); 
  const router = useRouter("");
  const { user, isLoading } = useAuth();


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

      {isLoading ? (
        <div className="user-profile"></div>
      ) : user ? (
          <div
            className={`user-profile ${isDropdownOpen ? "active" : ""}`}
            onClick={toggleDropdown} 
            ref={userProfileRef}  
          >
            <span className="user-name">{user?.user_name || "ผู้ใช้"}</span>

            {/* Dropdown เมนู */}
            <div className="dropdown" ref={dropdownRef}>
              <ul>
                {user?.role === "customer" &&  <li><img src="/img/fblogo.png" alt="Home" style={{ width: '24px', height: '24px' }} /><a href="/editprofile">แก้ไขโปรไฟล์</a></li>}
                {user?.role === "customer" && <li><a href="/reservations">ดูรายละเอียดการจอง</a></li>}
                {user?.role === "customer" && <li><a href="/registerField">ลงทะเบียนสนาม</a></li>}
                {user?.role === "field_owner" && <li><a href="/editprofile">แก้ไขโปรไฟล์</a></li>}
                {user?.role === "field_owner" && <li><a href="/registerField">ลงทะเบียนสนาม</a></li>}
                {user?.role === "field_owner" && <li><a href="/myfield">สนามของฉัน</a></li>}
                {user?.role === "admin" && <li><a href="/editprofile">แก้ไขโปรไฟล์</a></li>}
                {user?.role === "admin" && <li><a href="/manager">จัดการผู้ใช้</a></li>}
                {user?.role === "admin" && <li><a href="/myfield">จัดการสนามกีฬา</a></li>}
                {user?.role === "admin" && <li><a href="/addfac">จัดการสิ่งอำนวยความสะดวก</a></li>}
                {user?.role === "admin" && <li><a href="/addtype">จัดการประเภทกีฬา</a></li>}
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
