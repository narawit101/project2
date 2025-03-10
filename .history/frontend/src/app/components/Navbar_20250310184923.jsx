"use client";
import React, { useState, useEffect,useRef  } from "react";
import LogoutButton from "./LogoutButton";
import "../css/Nav.css";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);  // ใช้ ref เพื่อจับการคลิก
  const userProfileRef = useRef(null);  // ใช้ ref กับ user-profile

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
    // คลิกที่นอก dropdown หรือ user-profile จะปิดเมนู
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !userProfileRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    // ฟังการคลิกที่นอกองค์ประกอบ
    document.addEventListener("click", handleClickOutside);

    // ทำความสะอาดเมื่อ component ถูก unmount
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
      <a href="/" className="logo">
        ⚽{" "}
      </a>

      {/* เมนูหลัก */}
      <ul className={isMenuOpen ? "active" : ""}>
        <li>
          <a href="/">หน้าแรก</a>
        </li>
        <li>
          <a href="/categories">หมวดหมู่</a>
        </li>
        <li>
          <a href="/contact">ติดต่อเรา</a>
        </li>
      </ul>

      {/* ส่วนของ User */}
      <div className="user">
        <input type="text" placeholder="🔍 ค้นหา" className="search-box" />
        {token && user ? (
          <div
            className={`user-profile ${isDropdownOpen ? "active" : ""}`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {/* รูปโปรไฟล์ */}
            {/* <img 
              src={user.profile_image || "/default-profile.png"} 
              alt="Profile" 
              className="profile-img"
            /> */}
            <span className="user-name">{user.user_name || "ผู้ใช้"}</span>

            {/* Dropdown เมนู */}
            <div className="dropdown" ref={dropdownRef}> {/* เพิ่ม ref */}
              <ul>
                <li><a href="/profile">แก้ไขโปรไฟล์</a></li>
                {user.role === "customer" && <li><a href="/reservations">ดูรายละเอียดการจอง</a></li>}
                {user.role === "field_owner" && <li><a href="/register-field">ลงทะเบียนสนาม</a></li>}
                {user.role === "admin" && <li><a href="/manage-users">จัดการผู้ใช้</a></li>}
                <li><LogoutButton /></li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <a href="/login" className="login">
              เข้าสู่ระบบ
            </a>
            <a href="/register" className="register">
              สมัครสมาชิก
            </a>
          </>
        )}
        {/* ปุ่มแฮมเบอร์เกอร์เมนู */}
        <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
}
