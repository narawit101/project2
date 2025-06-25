"use client";
import React, { Suspense } from "react";

import Search from "@/app/components/Search";

export default function page() {
  return (
    <div>
      <Suspense fallback={<div></div>}>
        <Search />;
      </Suspense>
    </div>
  );
}
