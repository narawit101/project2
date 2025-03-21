import React from "react";
import EditProfile from "../components/EditProfile";
import Navbar from "@/app/components/Navbar";


export default function page() {
  return (
    <div>
      <Navbar></Navbar>
      <EditProfile></EditProfile>
    </div>
  );
}
