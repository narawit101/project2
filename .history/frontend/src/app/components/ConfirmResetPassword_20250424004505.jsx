"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";


export default function ConfirmResetPassword() {

     useEffect(() => {
        const token = JSON.parse(localStorage.getItem("token"));
        const expiresAt = JSON.parse(localStorage.getItem("expiresAt"));
    
        // ตรวจสอบว่า token หมดอายุหรือไม่
        if (token && Date.now() < expiresAt) {
          const user = JSON.parse(localStorage.getItem("user"));
          if (user?.status !== "ตรวจสอบแล้ว") {
            router.push("/verification");
          }
        } else {
          // ถ้า token หมดอายุ หรือไม่มี token
          localStorage.removeItem("token");
          localStorage.removeItem("expiresAt");
          localStorage.removeItem("user");
          router.push("/resetPassword");
        }
      }, []);
  return (
    <div>ConfirmResetPassword</div>
  )
}
