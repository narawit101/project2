"use client";
import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import LogoutButton from "@/app/components/Logout";
import "@/app/css/navbar.css";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const userProfileRef = useRef(null);
  const notifyRef = useRef(null);
  const notifyBtnRef = useRef(null);
  const menuRef = useRef(null);
  const hamburgerRef = useRef(null);
  const authDropdownRef = useRef(null);
  const authButtonRef = useRef(null);

  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !(userProfileRef.current && userProfileRef.current.contains(e.target))
      ) {
        setIsDropdownOpen(false);
      }
      if (
        authDropdownRef.current &&
        !authDropdownRef.current.contains(e.target) &&
        !(authButtonRef.current && authButtonRef.current.contains(e.target))
      ) {
        setIsAuthDropdownOpen(false);
      }
      if (
        notifyRef.current &&
        !notifyRef.current.contains(e.target) &&
        !(notifyBtnRef.current && notifyBtnRef.current.contains(e.target))
      ) {
        setIsNotifyOpen(false);
      }
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !(hamburgerRef.current && hamburgerRef.current.contains(e.target))
      ) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
        setIsSearchOpen(false);
        setIsNotifyOpen(false);
        setIsMenuOpen(false);
        setIsAuthDropdownOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav className="nav">
      <div className="ullist">
        <button
          className="hamburger"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label="เปิดเมนู"
          ref={hamburgerRef}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </div>
      <div className="mid-logo">
        <Link href="/" className="logo">
          <img
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1750926494/logo2_jxtkqq.png"
            alt="Sport-Hub Logo"
            width="100"
            height="70"
            style={{ objectFit: "cover" }}
          />
        </Link>
      </div>
      <div className="user">
        <div className="search-container" ref={searchRef}>
          <button
            className="icon-btn search-button"
            onClick={() => setIsSearchOpen((v) => !v)}
            aria-label="ค้นหา"
          >
            <img
              src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755158827/garden--search-26_f3tko8.png"
              alt="ค้นหา"
              width="26"
              height="26"
            />
          </button>
          <input
            type="text"
            placeholder="ค้นหา..."
            className={`search-box ${isSearchOpen ? "active" : ""}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const query = e.currentTarget.value.trim();
                if (query)
                  router.push(`/search?query=${encodeURIComponent(query)}`);
                setIsSearchOpen(false);
              }
            }}
          />
        </div>

        {isLoading ? (
          <span className="dot-loading">
            <span className="dot one">●</span>
            <span className="dot two">●</span>
            <span className="dot three">●</span>
          </span>
        ) : user ? (
          <div
            className={`user-profile ${isDropdownOpen ? "active" : ""}`}
            onClick={() => setIsDropdownOpen((v) => !v)}
            ref={userProfileRef}
          >
            <img
              alt="โปรไฟล์"
              width={30}
              height={30}
              className="avatar"
              src={
                user?.user_profile
                  ? user.user_profile
                  : "https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157542/qlementine-icons--user-24_zre8k9.png"
              }
            />

            <div className="dropdown" ref={dropdownRef}>
              <ul>
                <li className="dropdown-user">
                  {user?.first_name} {""}
                  {user?.last_name}
                </li>
                <li className="dropdown-role">
                  {user?.role === "admin" && "ผู้ดูแลระบบ"}
                  {user?.role === "field_owner" && "เจ้าของสนามกีฬา"}
                  {user?.role === "customer" && "ลูกค้า"}
                </li>
                <hr className="dropdown-divider" />
                <li>
                  <Link href="/edit-profile">
                    <img
                      src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755270276/tdesign--user-setting_zxrpzz.png"
                      width={20}
                      height={20}
                      alt=""
                    />
                    แก้ไขโปรไฟล์
                  </Link>
                </li>
                {/* {user?.role === "customer" && (
                  <li>
                    <Link href="/register-field">ลงทะเบียนสนาม</Link>
                  </li>
                )} */}
                {user?.role === "field_owner" && (
                  <>
                    <li>
                      <Link href="/my-field">
                        <img
                          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755270427/material-symbols--stadium-outline_ile9cr.png"
                          width={20}
                          height={20}
                          alt=""
                        />
                        สนามกีฬาของฉัน
                      </Link>
                    </li>
                  </>
                )}
                {user?.role === "admin" && (
                  <>
                    <li>
                      <Link href="/manage-user">
                        <img
                          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755270798/la--user-lock_ouffik.png"
                          width={20}
                          height={20}
                          alt=""
                        />
                        จัดการผู้ใช้
                      </Link>
                    </li>
                    <li>
                      <Link href="/my-field">
                        <img
                          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755270427/material-symbols--stadium-outline_ile9cr.png"
                          width={20}
                          height={20}
                          alt=""
                        />
                        จัดการสนามกีฬา
                      </Link>
                    </li>
                    <li>
                      <Link href="/manage-facility">
                        <img
                          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755270985/fluent-emoji-high-contrast--running-shoe_c5koea.png"
                          width={20}
                          height={20}
                          alt=""
                        />
                        จัดการสิ่งอำนวยความสะดวก
                      </Link>
                    </li>
                    <li>
                      <Link href="/manage-sport-type">
                        <img
                          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755270745/fluent--sport-20-regular_djdy8v.png"
                          width={20}
                          height={20}
                          alt=""
                        />
                        จัดการประเภทกีฬา
                      </Link>
                    </li>
                  </>
                )}
                {(user?.role === "customer" ||
                  user?.role === "admin" ||
                  user?.role === "field_owner") && (
                  <li>
                    <Link href="/my-booking">
                      <img
                        src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755270498/icon-park-outline--doc-detail_1_kbh7dy.png"
                        width={20}
                        height={20}
                        alt=""
                      />
                      รายการจองสนามของฉัน
                    </Link>
                  </li>
                )}
                <LogoutButton />
              </ul>
            </div>
          </div>
        ) : (
          <div
            className={`user-profile ${isAuthDropdownOpen ? "active" : ""}`}
            onClick={() => setIsAuthDropdownOpen((v) => !v)}
            ref={authButtonRef}
          >
            <img
              src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1756123318/mdi--register_ndxxeb.png"
              alt="โปรไฟล์"
              width={28}
              height={28}
              // className="avatar"
            />

            <div className="dropdown" ref={authDropdownRef}>
              <ul>
                <li>
                  <Link
                    href="/login"
                    onClick={() => setIsAuthDropdownOpen(true)}
                  >
                    <img
                      src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1756123250/ic--baseline-login_gzhjrf.png"
                      alt=""
                    />
                    เข้าสู่ระบบ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    onClick={() => setIsAuthDropdownOpen(true)}
                  >
                    <img
                      src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1756123318/mdi--register_ndxxeb.png"
                      alt=""
                    />
                    สมัครสมาชิก
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        )}
        {user && (
          <div className="notify">
            <button
              className="icon-btn notify-btn"
              onClick={() => setIsNotifyOpen((v) => !v)}
              aria-label="แจ้งเตือน"
              ref={notifyBtnRef}
            >
              <img
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755157482/mdi-light--bell_wt2uc1.png"
                alt=""
                width={30}
                height={30}
              />
              <span className="badge">99</span>
            </button>

            {isNotifyOpen && (
              <div className="notify-dropdown" ref={notifyRef}>
                <ul>
                  <li>
                    การจอง #1290 ยืนยันแล้ว
                    <span className="time">5 นาทีที่แล้ว</span>
                  </li>
                  <li>
                    ใกล้ถึงเวลาจอง 19:00–20:00
                    <span className="time">1 ชม.ที่แล้ว</span>
                  </li>
                  <li>
                    มีคอมเมนต์ใหม่ในโพสต์ของคุณ
                    <span className="time">เมื่อวานนี้</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className={`menu-overlay ${isMenuOpen ? "show" : ""}`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden
      />
      <aside className={`side-menu ${isMenuOpen ? "open" : ""}`} ref={menuRef}>
        <div className="side-header">
          <button
            className="close-x"
            onClick={() => setIsMenuOpen(false)}
            aria-label="ปิดเมนู"
          >
            ×
          </button>
        </div>
        <ul className="side-list">
          <li>
            <Link
              href="/"
              className={pathname === "/" ? "active" : ""}
              onClick={() => setIsMenuOpen(false)}
            >
              <img
                className={pathname === "/" ? "active" : ""}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755164212/material-symbols-light--home-outline-rounded_ebvqko.png"
                alt=""
                width={30}
                height={30}
              />
              หน้าแรก
            </Link>
          </li>
          <li>
            <Link
              className={pathname === "/categories" ? "active" : ""}
              href="/categories"
              onClick={() => setIsMenuOpen(false)}
            >
              <img
                width={30}
                height={30}
                src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755163390/material-symbols-light--stadium-outline-rounded_db1dco.png"
                alt=""
              />
              สนามกีฬาทั้งหมด
            </Link>
          </li>
          {user && (
            <li>
              <Link
                className={pathname === "/contact" ? "active" : ""}
                href="/contact"
                onClick={() => setIsMenuOpen(false)}
              >
                <img
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755163804/qlementine-icons--user-24_zojp8t.png"
                  alt=""
                  width={30}
                  height={30}
                />
                ติดต่อผู้ดูแลระบบ
              </Link>
            </li>
          )}

          {user && (
            <li>
              <Link
                className={pathname === "/register-field" ? "active" : ""}
                href="/register-field"
                onClick={() => setIsMenuOpen(false)}
              >
                <img
                  src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755163884/register-svgrepo-com_szyit9.png"
                  alt=""
                  width={30}
                  height={30}
                />
                ลงทะเบียนสนามกีฬา
              </Link>
            </li>
          )}
        </ul>
      </aside>
    </nav>
  );
}
