"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../css/editProfile.css";

export default function EditProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [emailError, setEmailError] = useState(""); // สำหรับแสดงข้อความ error
  const [updatedUser, setUpdatedUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
  });
  const [users, setUsers] = useState([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setUpdatedUser({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
      });
    } else {
      router.push("/login");
    }
  }, []);

  const isEmailDuplicate = (email) => {
    return users.some(
      (user) => user.email === email && user.user_id !== currentUser?.user_id
    );
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // ตรวจสอบว่าอีเมลซ้ำไหม
    if (isEmailDuplicate(updatedUser.email)) {
      setEmailError("อีเมลนี้มีการใช้งานแล้ว");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${currentUser.user_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailError(data.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
        return;
      }

      // เก็บข้อมูลผู้ใช้ที่อัปเดตลงใน localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({ ...currentUser, ...updatedUser })
      );
      alert("ข้อมูลโปรไฟล์ของคุณถูกอัปเดตแล้ว");
      router.push("/editprofile");
    } catch (error) {
      console.error("Error updating profile:", error);
      setEmailError("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    }
  };

  return (
    <div className="edit-profile-container">
      <h2>แก้ไขโปรไฟล์</h2>
      <form onSubmit={handleUpdateProfile}>
        <label>ชื่อ:</label>
        <input
          type="text"
          value={updatedUser.first_name}
          onChange={(e) =>
            setUpdatedUser({ ...updatedUser, first_name: e.target.value })
          }
        />
        <label>นามสกุล:</label>
        <input
          type="text"
          value={updatedUser.last_name}
          onChange={(e) =>
            setUpdatedUser({ ...updatedUser, last_name: e.target.value })
          }
        />
        <label>อีเมล:</label>
        <input
          type="email"
          value={updatedUser.email}
          onChange={(e) =>
            setUpdatedUser({ ...updatedUser, email: e.target.value })
          }
        />
        {emailError && <p style={{ color: "red" }}>{emailError}</p>}{" "}
        <label>เปลี่ยนรหัสผ่าน</label>
        <a href="/change-password" className="change-password-link">
          เปลี่ยนรหัสผ่าน
        </a>
        <button type="submit" className="save-btn">
          บันทึก
        </button>
      </form>
    </div>
  );
}
