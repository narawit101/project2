"use client";
import React, { Suspense } from "react";
import Search from "@/app/components/Search";

// บรรทัดนี้สำคัญมาก
export const dynamic = 'force-dynamic';

export default function page() {
  return (
    <div>
      <Suspense fallback={<div>กำลังโหลด...</div>}>
        <Search />
      </Suspense>
    </div>
  );
}