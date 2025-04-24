"use client"
import React, { useState } from "react";


export default function ResetPassword() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [email, SetEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  return <div></div>;
}
