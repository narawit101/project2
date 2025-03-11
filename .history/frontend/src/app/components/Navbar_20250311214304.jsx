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
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const userProfileRef = useRef(null); 

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
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

      <div className="ullist">
        <ul className={isMenuOpen ? "active" : ""}>
          <li><a href="/">หน้าแรก</a></li>
          <li><a href="/categories">หมวดหมู่</a></li>
          <li><a href="/contact">ติดต่อเรา</a></li>
        </ul>
      </div>

      <div className="user">
        <div className="search-container" ref={searchRef}>
          <button className="search-button" onClick={() => setIsSearchOpen(!isSearchOpen)}>🔍</button>
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
            ref={userProfileRef}
          >
            <span className="user-name">{user.user_name || "ผู้ใช้"}</span>

            <div className="dropdown" ref={dropdownRef}>
              <ul>
                <li><a href="/editprofile">แก้ไขโปรไฟล์</a></li>
                {user.role === "customer" && <li><a href="/reservations">ดูรายละเอียดการจอง</a></li>}
                {user.role === "field_owner" && <li><a href="/register-field">แก้ไขสนามกีฬา</a></li>}
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

        <div className="hamburger" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
}
