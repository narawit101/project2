import React from "react";
import EditProfile from "../components/EditProfile";
import Navbar from "../components/Navbar";
import Footer from "./components/Footer";

export default function page() {
  return (
    <div>
      <Navbar></Navbar>
      <EditProfile></EditProfile>
      <Footer></Footer>
    </div>
  );
}
