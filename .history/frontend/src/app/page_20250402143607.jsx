import React from "react";
// import Navbar from "./components/Navbar";
import HomePage from "./components/Home";
import "@/app/css/HomePage.css"

export default function page() {
  return (
    <div>
      {/* <div className="navbar">
        <Navbar></Navbar>
      </div> */}
      <HomePage></HomePage>
    </div>
  );
}
