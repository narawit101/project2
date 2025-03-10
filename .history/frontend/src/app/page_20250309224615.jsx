import React from "react";
import Navbar from "../components/Navbar";

export default function page() {
  return (
    <>
    <Navbar />
      <div>
        <a href="/register">Register</a>
      </div>
      <div>
        <a href="/login">Login</a>
      </div>
    </>
  );
}
