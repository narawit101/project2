"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/css/edit-profile.css";
import { useAuth } from "@/app/contexts/AuthContext";
import Link from "next/link";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";

export default function EditProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({
    first_name: "",
    last_name: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  usePreventLeave(startProcessLoad);

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
      });
    } else {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    SetstartProcessLoad(true);
    if (!currentUser || !currentUser.user_id) {
      setMessage("ไม่พบข้อมูลผู้ใช้");
      setMessageType("error");
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const token = localStorage.getItem("auth_mobile_token");

      const response = await fetch(
        `${API_URL}/users/update-profile/${currentUser.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          body: JSON.stringify(updatedUser),
        }
      );

      if (response.status === 403) {
        setMessage("คุณไม่มีสิทธิ์แก้ไขข้อมูลนี้");
        setMessageType("error");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        setMessage(data.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
        setMessageType("error");
        return;
      }
      setMessage("ข้อมูลโปรไฟล์ของคุณถูกอัปเดตแล้ว");
      setMessageType("success");
      router.push("");
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("เกิดข้อผิดพลาดในการอัปเดตข้อมูล", error);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  const formatDateToThai = (date) => {
    if (!date) return "ไม่ทราบวันที่"; // กัน null/undefined

    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) return "ไม่สามารถแปลงวันที่ได้"; // กัน Invalid Date

    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Intl.DateTimeFormat("th-TH", options).format(parsedDate);
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2500);

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
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
      <div className="edit-profile-container">
        <h2 className="head-edit-profile">ข้อมูลของคุณ</h2>
        <form onSubmit={handleUpdateProfile} className="editprofile-form">
          <div className="user-info">
            <div className="info-row">
              <p>
                <strong>ชื่อผู้ใช้:</strong> {currentUser?.user_name}
              </p>
              <p>
                <strong>อีเมล:</strong> {currentUser?.email}
              </p>
            </div>
            <div className="info-row">
              <p>
                <strong>บทบาท:</strong>
                {currentUser?.role === "admin" ? (
                  <strong className="user-role-editprofile">ผู้ดูแลระบบ</strong>
                ) : currentUser?.role === "customer" ? (
                  <strong className="user-role-editprofile">ลูกค้า</strong>
                ) : currentUser?.role === "field_owner" ? (
                  <strong className="user-role-editprofile">
                    เจ้าของสนามกีฬา
                  </strong>
                ) : (
                  "ไม่ทราบบทบาท"
                )}
              </p>
              <p>
                <strong>สถานะ:</strong>
                <strong
                  className={`status-text-manager ${
                    currentUser?.status === "รอยืนยัน"
                      ? "pending"
                      : currentUser?.status === "ตรวจสอบแล้ว"
                      ? "approved"
                      : "unknown"
                  }`}
                >
                  {currentUser?.status}
                </strong>
              </p>
            </div>
            <div className="info-row">
              <p>
                <strong>วันที่สมัคร:</strong>{" "}
                {formatDateToThai(currentUser?.created_at)}
              </p>
            </div>
          </div>
          <label className="edit-profile-title">แก้ไขชื่อ-สนามสกุล</label>

          <label className="edit-profile-title-first-last_name">ชื่อ:</label>
          <input
            type="text"
            maxLength={100}
            value={updatedUser.first_name}
            onChange={(e) =>
              setUpdatedUser({ ...updatedUser, first_name: e.target.value })
            }
          />
          <label className="edit-profile-title-first-last_name">นามสกุล:</label>
          <input
            type="text"
            maxLength={100}
            value={updatedUser.last_name}
            onChange={(e) =>
              setUpdatedUser({ ...updatedUser, last_name: e.target.value })
            }
          />
          <Link href="/change-password" className="change-password-link">
            เปลี่ยนรหัสผ่าน
          </Link>
          <button
            type="submit"
            className="save-btn"
            style={{
              cursor: startProcessLoad ? "not-allowed" : "pointer",
            }}
            disabled={startProcessLoad}
          >
            {startProcessLoad ? (
              <span className="dot-loading">
                <span className="dot one">●</span>
                <span className="dot two">●</span>
                <span className="dot three">●</span>
              </span>
            ) : (
              "บันทึก"
            )}
          </button>
        </form>
      </div>
    </>
  );
}
