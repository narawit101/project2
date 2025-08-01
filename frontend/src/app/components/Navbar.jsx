"use client";
import React, { useState, useEffect, useRef } from "react";
import LogoutButton from "@/app/components/Logout";
import "@/app/css/navbar.css";
import { useRouter, usePathname } from "next/navigation";
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !userProfileRef.current.contains(event.target)
      ) {
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
      <Link href="/" className="logo">
        <img
          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926494/logo2_jxtkqq.png"
          alt="Sport-Hub Logo"
          width="100"
          height="70"
          style={{ objectFit: "cover" }}
        />
      </Link>

      <div className="ullist">
        <ul className={isMenuOpen ? "active" : ""}>
          <li>
            <Link href="/" className={pathname === "/" ? "active" : ""}>
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
              ติดต่อ
            </Link>
          </li>
        </ul>
        <div className="hamburger" onClick={toggleMenu}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
      <div className="user">
        <div className="search-container" ref={searchRef}>
          <button
            className="search-button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <img
              src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750938907/pngtree-magnifying-glass-flat-icon-png-image_9150673_sgxpu1.png"
              alt="Sport-Hub Logo"
              width="30"
              height="30"
              style={{ objectFit: "cover", margin: "4px" }}
            />
          </button>
          <input
            type="text"
            placeholder="ค้นหา..."
            className={`search-box ${isSearchOpen ? "active" : ""}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const query = e.target.value.trim();
                if (query) {
                  router.push(`/search?query=${encodeURIComponent(query)}`);
                }
              }
            }}
          />
        </div>

        {isLoading ? (
          <span className="dot-loading">
            <span className="dot one">●</span>
            <span className="dot two">●</span>
            <span className="dot three">● </span>
          </span>
        ) : user ? (
          <div
            className={`user-profile ${isDropdownOpen ? "active" : ""}`}
            onClick={toggleDropdown}
            ref={userProfileRef}
          >
            <span className="user-name">{user?.user_name || "ผู้ใช้"}</span>

            <div className="dropdown" ref={dropdownRef}>
              <ul>
                {user?.role === "customer" && (
                  <li>
                    <Link href="/edit-profile">แก้ไขโปรไฟล์</Link>
                  </li>
                )}
                {user?.role === "customer" && (
                  <li>
                    <Link href="/register-field">ลงทะเบียนสนาม</Link>
                  </li>
                )}
                {user?.role === "field_owner" && (
                  <li>
                    <Link href="/edit-profile">แก้ไขโปรไฟล์</Link>
                  </li>
                )}
                {user?.role === "field_owner" && (
                  <li>
                    <Link href="/register-field">ลงทะเบียนสนาม</Link>
                  </li>
                )}
                {user?.role === "field_owner" && (
                  <li>
                    <Link href="/my-field">สนามของฉัน</Link>
                  </li>
                )}
                {/* {user?.role === "field_owner" && <li><Link href="/bookingOrder">คำสั่งจองสนามของฉัน</Link></li>}
                {user?.role === "admin" && <li><Link href="/bookingOrder">คำสั่งจองสนามของฉัน</Link></li>} */}
                {user?.role === "admin" && (
                  <li>
                    <Link href="/edit-profile">แก้ไขโปรไฟล์</Link>
                  </li>
                )}
                {user?.role === "admin" && (
                  <li>
                    <Link href="/manage-user">จัดการผู้ใช้</Link>
                  </li>
                )}
                {user?.role === "admin" && (
                  <li>
                    <Link href="/my-field">จัดการสนามกีฬา</Link>
                  </li>
                )}
                {user?.role === "admin" && (
                  <li>
                    <Link href="/manage-facility">
                      จัดการสิ่งอำนวยความสะดวก
                    </Link>
                  </li>
                )}
                {user?.role === "admin" && (
                  <li>
                    <Link href="/manage-sport-type">จัดการประเภทกีฬา</Link>
                  </li>
                )}
                {(user?.role === "customer" ||
                  user?.role === "admin" ||
                  user?.role === "field_owner") && (
                  <li>
                    <Link href="/my-booking">รายการจองของฉัน</Link>
                  </li>
                )}
                <LogoutButton />
              </ul>
            </div>
          </div>
        ) : (
          <>
            <Link href="/login" className="login">
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="register">
              สมัครสมาชิก
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
