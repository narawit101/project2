"use client";
import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/editProfile.css";

export default function EditProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" }); // สำหรับเก็บข้อความสำเร็จและข้อผิดพลาด
  const [users, setUsers] = useState([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if(user.status !== "ตรวจสอบแล้ว"){
      router.push("/verification")
    }
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage({ text: "กรุณาเข้าสู่ระบบอีกครั้ง", type: "error" });
      router.push("/login");
      return;
    }

    // ✅ ตรวจสอบว่า user_id ถูกต้อง
    if (!currentUser || !currentUser.user_id) {
      setMessage({ text: "ไม่พบข้อมูลผู้ใช้", type: "error" });
      return;
    }
    try {
      const checkResponse = await fetch(`${API_URL}/users/check-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: updatedUser.email }),
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        setMessage({
          text: checkData.message || "เกิดข้อผิดพลาดในการตรวจสอบอีเมล",
          type: "error",
        });
        return;
      }

      if (checkData.exists && checkData.user_id !== currentUser.user_id) {
        setMessage({ text: "อีเมลนี้ถูกใช้งานแล้ว", type: "error" });
        return;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setMessage({ text: "เกิดข้อผิดพลาดในการตรวจสอบอีเมล", type: "error" });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${currentUser.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUser),
      });

      if (response.status === 403) {
        setMessage({ text: "คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้", type: "error" });
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        setMessage({
          text: data.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
          type: "error",
        });
        return;
      }

      // ✅ บันทึกข้อมูลที่อัปเดตลงใน LocalStorage
      localStorage.setItem(
        "user",
        JSON.stringify({ ...currentUser, ...updatedUser })
      );
      setMessage({ text: "ข้อมูลโปรไฟล์ของคุณถูกอัปเดตแล้ว", type: "success" });
      router.push("/editprofile");
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ text: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล", type: "error" });
    }
  };
  useEffect(() => {
      if (message) {
        const timer = setTimeout(() => {
          setMessage("");
        }, 2000);
  
        return () => clearTimeout(timer);
      }
    }, [message]);

  return (
    <>
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
          {/* แสดงข้อความผิดพลาดหรือสำเร็จ */}
          {message.text && (
            <div className={`message ${message.type}`}>
              <p>{message.text}</p>
            </div>
          )}

          <button type="submit" className="save-btn">
            บันทึก
          </button>
          <label>เปลี่ยนรหัสผ่าน</label>
          <a href="/change-password" className="change-password-link">
            เปลี่ยนรหัสผ่าน
          </a>
        </form>
      </div>
    </>
  );
}
