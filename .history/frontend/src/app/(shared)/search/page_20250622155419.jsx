"use client";
import Search from "@/app/components/Serach";

export default function page() {
  return (
    <div>
      <Suspense fallback={<div>กำลังโหลด...</div>}>
        <Search />;
      </Suspense>
    </div>
  );
}
