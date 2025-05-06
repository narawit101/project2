"use client";
import React, { useState, useEffect, useRef } from "react";
import LogoutButton from "@/app/components/LogoutButton";
import "@/app/css/Nav.css";
import { useRouter,usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import Link from "next/link";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null); 
  const dropdownRef = useRef(null);
  const userProfileRef = useRef(null); 
  const router = useRouter("");
  const pathname = usePathname();
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
      <Link href="/" className="logo">⚽</Link>
      <div className="ullist">
          <ul className={isMenuOpen ? "active" : ""}>
            <li>
              <Link
                href="/"
                className={pathname === "/" ? "active" : ""}
              >
                หน้าแรก
              </Link>
            </li>
            <li>
              <Link
                href="/categories"
                className={pathname === "/categories" ? "active" : ""}
              >
                หมวดหมู่
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className={pathname === "/contact" ? "active" : ""}
              >
                ติดต่อเรา
              </Link>
            </li>
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
                {user?.role === "customer" &&  <li><Link href="/editprofile">แก้ไขโปรไฟล์</Link></li>}
                {user?.role === "customer" && <li><a href="/reservations">ดูรายละเอียดการจอง</a></li>}
                {user?.role === "customer" && <li><a href="/registerField">ลงทะเบียนสนาม</a></li>}
                {user?.role === "field_owner" && <li><Link href="/editprofile">แก้ไขโปรไฟล์</Link></li>}
                {user?.role === "field_owner" && <li><a href="/registerField">ลงทะเบียนสนาม</a></li>}
                {user?.role === "field_owner" && <li><Link href="/myfield">สนามของฉัน</Link></li>}
                {user?.role === "admin" && <li><Link href="/editprofile">แก้ไขโปรไฟล์</Link></li>}
                {user?.role === "admin" && <li><Link href="/manager">จัดการผู้ใช้</Link></li>}
                {user?.role === "admin" && <li><Link href="/myfield">จัดการสนามกีฬา</Link></li>}
                {user?.role === "admin" && <li><Link href="/addfac">จัดการสิ่งอำนวยความสะดวก</Link></li>}
                {user?.role === "admin" && <li><Link href="/addtype">จัดการประเภทกีฬา</Link></li>}
                <LogoutButton />
              </ul>
            </div>
          </div>
        ) : (
          <>
            <Link href="/login" className="login">เข้าสู่ระบบ</Link>
            <Link href="/register" className="register">สมัครสมาชิก</Link>
          </>
        )}
      </div>
    </nav>
  );
}
