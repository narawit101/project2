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

      
    </nav>
  );
}
