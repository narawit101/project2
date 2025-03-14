"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedPage({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token"); // ✅ ดึง Token จาก LocalStorage
    const user = localStorage.getItem("user"); // ✅ ดึงข้อมูลผู้ใช้

    // ✅ ถ้าไม่มี Token หรือไม่มี User -> Redirect ไปหน้า Login
    if (!token || !user) {
      router.push("/login");
    }
  }, []);

  return <div>{children}</div>;
}
