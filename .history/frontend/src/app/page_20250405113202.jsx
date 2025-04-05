import React from "react";
import HomePage from "@/app/components/Home";
import Navbar from "@/app/components/Navbar";
import "@/app/css/HomePage.css"

export default function page() {
  return (
    <div>
        <div className="navbar">
          <Navbar></Navbar>
        </div>
      <HomePage></HomePage>
    </div>
  );
}
