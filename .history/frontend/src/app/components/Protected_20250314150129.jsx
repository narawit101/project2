"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedPage({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token"); 
    const user = localStorage.getItem("user"); 

    if (!token || !user) {
      router.push("/login");
    }
  }, []);

  return <div>{children}</div>;
}
