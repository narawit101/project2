"use client";
import dynamic from "next/dynamic";
import React, { Suspense } from "react";

const Search = dynamic(() => import("@/app/components/Serach"), {
  ssr: false, // 👈 ปิด SSR
});

export default function Page() {
  return (
    <div>
      <Suspense fallback={<div>กำลังโหลด...</div>}>
        <Search />
      </Suspense>
    </div>
  );
}

