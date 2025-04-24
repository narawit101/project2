"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";


export default function ConfirmResetPassword() {
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
  return (
    <div>ConfirmResetPassword</div>
  )
}
