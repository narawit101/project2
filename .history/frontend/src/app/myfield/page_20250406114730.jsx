import React from "react";
import MyFields from "@/app/components/Myfields";
import { unique } from "next/dist/build/utils";
// import Navbar from "@/app/components/Navbar";

export default function page() {
  return (
    <div>
      {/* <Navbar></Navbar> */}
      <MyFields key={unique}/>
    </div>
  );
}
