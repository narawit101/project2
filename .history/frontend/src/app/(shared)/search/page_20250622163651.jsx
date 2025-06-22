// src/app/(shared)/search/page.jsx
import React, { Suspense } from "react";

const SearchComponent = React.lazy(() => import("@/app/components/Search"));

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchComponent />
    </Suspense>
  );
}