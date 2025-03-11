"use client";
import React, { useState, useEffect, useRef } from "react";
import LogoutButton from "./LogoutButton";
import "../css/Nav.css";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null); // ใช้ ref เพื่อตรวจจับการคลิกข้างนอก
  const dropdownRef = useRef(null);
  const userProfileRef = useRef(null); 

  useEffect(() => {
    // ดึง token และ user จาก localStorage
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
        {token && user ? (
          <div
            className={`user-profile ${isDropdownOpen ? "active" : ""}`}
            onClick={toggleDropdown} 
            ref={userProfileRef}  // เพิ่ม ref
          >
            <span className="user-name">{user.user_name || "ผู้ใช้"}</span>

            {/* Dropdown เมนู */}
            <div className="dropdown" ref={dropdownRef}> {/* เพิ่ม ref */}
              <ul>
                <li><a href="/editprofile">แก้ไขโปรไฟล์</a></li>
                {user.role === "customer" && <li><a href="/reservations">ดูรายละเอียดการจอง</a></li>}
                {user.role === "customer" && <li><a href="/register-field">ลงทะเบียนสนาม</a></li>}
                {user.role === "field_owner" && <li><a href="/register-field">แก้ไขสนามกีฬา</a></li>}
                {user.role === "field_owner" && <li><a href="/register-field">ลงทะเบียนสนาม</a></li>}
                {user.role === "admin" && <li><a href="/manager">จัดการผู้ใช้</a></li>}
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
        {/* Hamburger Menu */}
        
      </div>
    </nav>
  );
}
