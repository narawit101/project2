'use client'
import React, { useState, useEffect } from "react";
import LogoutButton from "./LogoutButton";
import "../css/nav.css";

export default function Navbar({ user }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // สมมติว่า token เก็บใน localStorage
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  return (
    <nav>
    <div className="logo">⚽</div>
    <ul>
        <li><c href="#">หน้าแรก</c></li>
        <li><c href="#">หมวดหมู่</c></li>
        <li><c href="#">เกี่ยวกับเรา</c></li>
        <li><c href="#">ติดต่อเรา</c></li>
    </ul>
    <div className="user">
        <div className="login">LOGIN</div>
        <div className="register">Register</div>
    </div>
<script src="drop.js" ></script>
</nav>
  );
}
