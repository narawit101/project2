"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../css/editProfile.css";

export default function EditProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
  });
  const [errorMessages, setErrorMessages] = useState([]); // เก็บข้อผิดพลาดทั้งหมด
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

    // เก็บข้อผิดพลาดทั้งหมด
    const errors = [];

    // ตรวจสอบว่าอีเมลซ้ำไหม
    if (isEmailDuplicate(updatedUser.email)) {
      errors.push("อีเมลนี้มีการใช้งานแล้ว");
    }

    // ตรวจสอบว่า role มีค่าหรือไม่
    if (!updatedUser.role) {
      errors.push("โปรดเลือก role สำหรับผู้ใช้");
    }

    // ถ้ามีข้อผิดพลาดให้แสดงทั้งหมด
    if (errors.length > 0) {
      setErrorMessages(errors);
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
        setErrorMessages([data.message || "a"]);
        return;
      }

      // เก็บข้อมูลผู้ใช้ที่อัปเดตลงใน localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({ ...currentUser, ...updatedUser })
      );
      setErrorMessages(["ข้อมูลโปรไฟล์ของคุณถูกอัปเดตแล้ว"]);
      router.push("/editprofile");
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessages(["เกิดข้อผิดพลาดในการอัปเดตข้อมูล"]);
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
        {/* แสดงข้อความผิดพลาดทั้งหมด */}
        {errorMessages.length > 0 && (
          <div className="error-messages">
            {errorMessages.map((msg, index) => (
              <p key={index} style={{ color: "red" }}>
                {msg}
              </p>
            ))}
          </div>
        )}
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
