import React from "react";
import LogoutButton from "./LogoutButton";
import React, { useState } from "react";
export default function Navbar() {
  return (
    <nav style={{ display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#333", color: "white" }}>
      <h2>My App</h2>
      <LogoutButton />
    </nav>
  );
}
