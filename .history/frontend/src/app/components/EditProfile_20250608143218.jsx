"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/editProfile.css";
import { useAuth } from "@/app/contexts/AuthContext";
import Link from "next/link";

export default function EditProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
    if (user) {
      setCurrentUser(user);
      setUpdatedUser({
        first_name: user?.first_name,
        last_name: user?.last_name,
        email: user?.email,
        role: user?.role,
      });
    } else {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    SetstartProcessLoad(true);
    if (!currentUser || !currentUser.user_id) {
      setMessage({ text: "ไม่พบข้อมูลผู้ใช้", type: "error" });
      return;
    }
    // try {
    //   const checkResponse = await fetch(`${API_URL}/users/check-email`, {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     credentials: "include",
    //     body: JSON.stringify({ email: updatedUser.email }),
    //   });

    //   const checkData = await checkResponse.json();

    //   if (!checkResponse.ok) {
    //     setMessage({
    //       text: checkData.message || "เกิดข้อผิดพลาดในการตรวจสอบอีเมล",
    //       type: "error",
    //     });
    //     return;
    //   }

    //   if (checkData.exists && checkData.user_id !== currentUser.user_id) {
    //     setMessage({ text: "อีเมลนี้ถูกใช้งานแล้ว", type: "error" });
    //     return;
    //   }
    // } catch (error) {
    //   console.error("Error checking email:", error);
    //   setMessage({ text: "เกิดข้อผิดพลาดในการตรวจสอบอีเมล", type: "error" });
    //   return;
    // }

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const response = await fetch(`${API_URL}/users/${currentUser.user_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
      setMessage({ text: "ข้อมูลโปรไฟล์ของคุณถูกอัปเดตแล้ว", type: "success" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ text: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล", type: "error" });
    } finally {
      SetstartProcessLoad(false);
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

  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <>
      <div className="edit-profile-container">
        <h2 className="head-edit-profile">แก้ไขโปรไฟล์</h2>
        <form onSubmit={handleUpdateProfile} className="editprofile-form">
          <label className="edit-profile-title">ชื่อ:</label>
          <input
            type="text"
            maxLength={100}
            value={updatedUser.first_name}
            onChange={(e) =>
              setUpdatedUser({ ...updatedUser, first_name: e.target.value })
            }
          />
          <label className="edit-profile-title">นามสกุล:</label>
          <input
            type="text"
            maxLength={100}
            value={updatedUser.last_name}
            onChange={(e) =>
              setUpdatedUser({ ...updatedUser, last_name: e.target.value })
            }
          />
          {/* <label className="edit-profile-title">อีเมล:</label>
          <input
            type="email"
            value={updatedUser.email}
            onChange={(e) =>
              setUpdatedUser({ ...updatedUser, email: e.target.value })
            }
          /> */}

          {message.text && (
            <div className={`message ${message.type}`}>
              <p>{message.text}</p>
            </div>
          )}

          <button type="submit" className="save-btn">
            บันทึก
          </button>
          <label className="edit-profile-title">เปลี่ยนรหัสผ่าน</label>
          <Link href="/change-password" className="change-password-link">
            เปลี่ยนรหัสผ่าน
          </Link>
          {startProcessLoad && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
