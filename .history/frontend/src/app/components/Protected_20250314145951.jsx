"use client";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedPage({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token =
      document.cookie.includes("token") || localStorage.getItem("token");
    const user =
      document.cookie.includes("token") || localStorage.getItem("user");

    if (!token && user) {
      router.push("/login");
    }
  }, []);

  return <div>{children}</div>;
}
