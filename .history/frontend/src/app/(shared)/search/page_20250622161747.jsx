"use client";
import React, { Suspense } from "react";
import Search from "@/app/components/Search"; // Fixed typo: "Serach" -> "Search"

// Create a wrapper component for the search
function SearchWrapper() {
  return (
    <Suspense fallback={<div>กำลังโหลด...</div>}>
      <Search />
    </Suspense>
  );
}

export default function page() {
  return (
    <div>
      <SearchWrapper />
    </div>
  );
}