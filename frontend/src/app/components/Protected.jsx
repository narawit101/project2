"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedPage({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie.includes("token") || localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    }
  }, []);

  return <div>{children}</div>; 
}
