import React from "react";
import Navbar from "./components/Navbar";
import HomePage from "./components/Home";
import Footer from "./components/Footer";

export default function page() {
  return (
    <div>
      <Navbar></Navbar>
      <HomePage></HomePage>
      <Footer></Footer>
    </div>
  );
}
