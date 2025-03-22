"use client";
import React, { useEffect, useState } from "react";

export default function SportType() {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/sports_types/previwe`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ต้องมี token เพราะมี middleware auth
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลประเภทกีฬาได้");
        }
        return res.json();
      })
      .then((data) => {
        setSports(data);
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [API_URL]);

  return (
    <div className="sport-type-page">
      <h1>ประเภทกีฬาทั้งหมด</h1>
      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : sports.length > 0 ? (
        <ul>
          {sports.map((sport) => (
            <li key={sport.sport_id}>{sport.sport_name}</li>
          ))}
        </ul>
      ) : (
        <p>ไม่พบข้อมูลประเภทกีฬา</p>
      )}
    </div>
  );
}
