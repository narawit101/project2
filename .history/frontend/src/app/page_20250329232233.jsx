import React from "react";
import Navbar from "./components/Navbar";
import HomePage from "./components/Home";

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
