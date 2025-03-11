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
    <div class="logo">⚽</div>
    <ul class="nav-links">
        <li><a href="#">หน้าแรก</a></li>
        <li><a href="#">หมวดหมู่</a></li>
        <li><a href="#">ติดต่อเรา</a></li>
    </ul>
    <div class="search-container">
        <button class="search-button">🔍</button>
        <input type="text" class="search-box" placeholder="Search">
    </div>
</nav>
  );
}
