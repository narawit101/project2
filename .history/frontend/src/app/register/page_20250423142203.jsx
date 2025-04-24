import React from "react";
import Register from "@/app/components/Register";
// import Navbar from "@/app/components/Navbar";
import "@/app/css/register.css";
export default function page() {
  return (
    <>
      {/* <div className="navbar">
        <Navbar></Navbar>
      </div> */}
      <Register></Register>
      <div>
        <a href="/login">หรือคุณมีบัญชีอยู่แล้ว Login เลย</a>
      </div>
    </>
  );
}
