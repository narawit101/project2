"use client";
import { Suspense } from "react";
import NotFoundCard from "@/app/components/NotFoundCard";
import { useSearchParams, useRouter } from "next/navigation";

export default function ProfileIndexFallbackPage() {
  return (
    <Suspense fallback={null}>
      <ProfileIndexFallbackClient />
    </Suspense>
  );
}

function ProfileIndexFallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightId = searchParams.get("highlight");

  return (
    <NotFoundCard
      title={"ไม่พบโพสต์หรือสนามนี้"}
      description={`ลิงก์โพสต์ (#${
        highlightId || "?"
      }) ไม่ถูกต้อง สนามหรือโพสต์อาจถูกลบแล้ว\nหากมาจากการแจ้งเตือนเก่า รายการนั้นถูกลบออกจากระบบ`}
      primaryLabel={"ไปหน้าแรก"}
      onPrimary={() => router.replace("/")}
    />
  );
}
