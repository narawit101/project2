import React, { Suspense } from "react";
import Search from "@/app/components/Serach";

export default function page() {
  return (
    <div>
      <Suspense>
        <Search></Search>
      </Suspense>
    </div>
  );
}
