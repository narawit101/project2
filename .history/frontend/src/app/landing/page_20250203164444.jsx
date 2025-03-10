import React from "react";
import Navbar from "../components/Navbar";

export default function Landing() {
  return (
    <div>
      <ProtectedPage>
      <Navbar />
      <h1>ยินดีต้อนรับสู่ Landing Page</h1>
      </ProtectedPage>
    </div>
  );
}
