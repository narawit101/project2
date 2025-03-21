"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/add.css";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";

export default function RegisterFieldForm() {
  const router = useRouter("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [sports, setSports] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const [showConfirmModal, setShowConfirmModal] = useState(false); // สำหรับการแสดงโมดอล

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const expiresAt = localStorage.getItem("expiresAt");

    if (
      !token ||
      !storedUser ||
      !expiresAt ||
      Date.now() > parseInt(expiresAt)
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("expiresAt");
      router.push("/login");
      return;
    }

    const user = JSON.parse(storedUser);
    setCurrentUser(user);

    if (user.role !== "admin") {
      router.push("/");
    }

    setIsLoading(false);
  }, []);

  //  โหลดประเภทกีฬา
   useEffect(() => {
    fetch(`${API_URL}/sports_types`)
      .then((res) => res.json())
      .then((data) => {
        setSports(data);
        setIsLoading(false); // เมื่อดึงข้อมูลเสร็จแล้วจะ set isLoading เป็น false
      })
      .catch((error) => {
        console.error("Error fetching sports:", error);
        setMessage("ไม่สามารถดึงข้อมูลได้");
        setMessageType("error");
        setIsLoading(false); // เมื่อเกิดข้อผิดพลาดให้ set isLoading เป็น false
      });
  }, []);

  if (isLoading) {
    return (
      <div className="load">
        <span className="spinner"></span> กำลังโหลด...
      </div>
    );
  }

  return (
    <>
      {/* สิ่งอำนวยความสะดวก */}
      <div className="input-group">
        <label>ประเภทกีฬา</label>
      </div>
      <div className="sportcon">
  {sports.length > 0 ? (
    sports.map((sport) => (
      <div key={sport.sports_id}>{sport.name}</div> // Ensure key is unique
    ))
  ) : (
    <p>ไม่พบข้อมูลประเภทกีฬา</p>
  )}
</div>


      {/* ข้อความแสดงผล */}
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
    </>
  );
};
