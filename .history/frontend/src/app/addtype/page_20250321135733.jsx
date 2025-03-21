"use client";
import React, { useState, useEffect } from "react";
import "@/app/css/add.css";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";

export default function RegisterFieldForm() {
  const router = useRouter("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [showConfirmModal, setShowConfirmModal] = useState(false); // สำหรับการแสดงโมดอล
  const [sports, setSports] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(""); // State สำหรับข้อความ
  const [messageType, setMessageType] = useState(""); // State สำหรับประเภทของข้อความ (error, success)
  const [editSport, setEditSport] = useState(null); // สำหรับเก็บข้อมูลสิ่งอำนวยความสะดวกที่กำลังแก้ไข
  const [newSportName, setNewSportName] = useState(""); // สำหรับเก็บชื่อใหม่ของสิ่งอำนวยความสะดวก
  
  const [SportTypeToDelete, setSportTypeToDelete] = useState(null); // เก็บข้อมูลสิ่งอำนวยความสะดวกที่จะลบ
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
      .then((data) => setSports(data))
      .catch((error) => console.error("Error fetching sports:", error));
  }, []);

  const  confirmDeleteSportType = (id){

  }
  if (isLoading)
    return (
      <div className="load">
        <span className="spinner"></span> กำลังโหลด...
      </div>
    );

  return (
    <div>
      <div className="input-group">
        <label>ประเภทกีฬา</label>
      </div>
      <div className="con">
        <div className="typecon">
          {sports.length > 0 ? (
            sports.map((sport) => (
              <div key={sport.sport_id}>
                <div className="sportname">{sport.sport_name}</div>
                <button
                  className="editbtn"
                  type="button"
                  onClick={() => {
                    setEditSport(sport);
                    setNewSportName(sport.sport_name);
                  }}
                >
                  แก้ไข
                </button>
                <button
                  className="deletebtn"
                  type="button"
                  onClick={() => confirmDeleteSportType(sport.sport_id)}
                >
                  ลบ
                </button>
              </div>
            ))
          ) : (
            <p>ไม่มีข้อมูล</p>
          )}
        </div>
      </div>
      {/* ข้อความแสดงผล */}
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}
