// 1. ไฟล์ /app/(shared)/search/page.js
"use client";
import React, { Suspense } from "react";

// บังคับให้เป็น dynamic page
export const dynamic = 'force-dynamic';

// สร้าง Search component แบบ lazy loading
const SearchComponent = React.lazy(() => import("@/app/components/Search"));

export default function SearchPage() {
  return (
    <div>
      <Suspense fallback={<div>กำลังโหลด...</div>}>
        <SearchComponent />
      </Suspense>
    </div>
  );
}