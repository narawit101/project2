import React from "react";
import Login from "@/app/components/Login";
// import Navbar from "@/app/components/Navbar";
import "@/app/css/login.css";

export default function page() {
  return (
    <>
      {/* <div className="navbar">
        <Navbar></Navbar>
      </div> */}
      <Login>    <div>
        <a href="/register">ยังไม่มีบัญชี Register</a>
      </div></Login>
  
    </>
  );
}
