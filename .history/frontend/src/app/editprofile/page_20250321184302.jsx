import React from "react";
import EditProfile from "../components/EditProfile";
import Navbar from "@/ap/components/Navbar";


export default function page() {
  return (
    <div>
      <Navbar></Navbar>
      <EditProfile></EditProfile>
    </div>
  );
}
