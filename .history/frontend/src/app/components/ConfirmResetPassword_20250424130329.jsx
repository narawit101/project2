"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function ConfirmResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter("");

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("token"));
    const expiresAt = JSON.parse(localStorage.getItem("expiresAt"));
    if (token && Date.now() < expiresAt) {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.status !== "ตรวจสอบแล้ว") {
        router.push("/verification");
      }
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("expiresAt");
      localStorage.removeItem("user");
      router.push("/resetPassword");
    }
  }, []);

  const handlePasswirdChange = async (e) =>{
    e.preventDedault();

    if (newPassword !== confirmPassword){
      setMessage("รหัสไม่ตรงกัน")
      setMessageType("error")
      return;
    }
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    try{
     
      const response = await fetch(`${API_URL}/users/${user.user_id}/change-password,`,{
        method: "PUT",
        headers: {
          "Content-type": "application/json",
          Authoriaztion:`Bearer ${token}`
        }
      })
    }

  }
  return <div>ConfirmResetPassword</div>;
}
