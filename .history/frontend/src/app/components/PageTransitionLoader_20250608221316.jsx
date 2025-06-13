"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageTransitionLoader({ children }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2000); // ช้าเพื่อเห็น animation
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {loading && (
        <div className="load">
          <div className="spinner"></div>
        </div>
      )}
      {children}
    </>
  );
}
