"use client";
import { useState } from "react";

export default function Verification() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  const [otp, setOtp] = useState(""); 


  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  const data = JSON.parse(storedUser);
  const userId = data.user_id;

  const noSave = async (e) => {
    

    try {
      const res = await fetch(`${API_URL}/register/verify/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otp }),  
      });

      const result = await res.json();
      if (res.ok) {
        console.log("Verification successful:", result);
       
      } else {
        console.error("Verification failed:", result.message);
        alert(result.message || "Verification failed");
      }
    } catch (error) {
      console.error("Error during verification:", error);
      alert("An error occurred during verification");
    }
  };

  return (
    <div className="verification-container">
      <h1>Verification</h1>
      <form onSubmit={noSave}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <button type="submit">Verify</button>
      </form>
    </div>
  );
}