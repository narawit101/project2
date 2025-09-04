"use client";
import { useSearchParams, useRouter } from "next/navigation";
import NotFoundCard from "@/app/components/NotFoundCard";
import { useEffect, useState } from "react";

export default function ProfileIndexFallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    if (!highlightId) return;
  }, [highlightId]);

  return (
    <NotFoundCard
      title={"ไม่พบโพสต์หรือสนามนี้"}
      description={`ลิงก์โพสต์ (#${highlightId}) ไม่ถูกต้อง สนามหรือโพสต์อาจถูกลบแล้ว\nหากมาจากการแจ้งเตือนเก่า รายการนั้นถูกลบออกจากระบบ`}
      primaryLabel={"ไปหน้าแรก"}
      onPrimary={() => router.replace("/")}
    />
  );
}
